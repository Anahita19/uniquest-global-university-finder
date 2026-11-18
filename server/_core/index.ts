import "dotenv/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { recordPaymentEvent } from "../db";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers["stripe-signature"];
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
    if (!secret || typeof signature !== "string") {
      return res.status(400).json({ error: "Stripe webhook verification is not configured" });
    }
    const parts = Object.fromEntries(signature.split(",").map(part => {
      const [key, value] = part.split("=", 2);
      return [key, value];
    }));
    const timestamp = Number(parts.t);
    const expected = createHmac("sha256", secret).update(`${timestamp}.${raw.toString("utf8")}`).digest("hex");
    const provided = parts.v1 ?? "";
    const expectedBytes = Buffer.from(expected, "utf8");
    const providedBytes = Buffer.from(provided, "utf8");
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300 || expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
      return res.status(400).json({ error: "Invalid Stripe signature" });
    }
    try {
      const event = JSON.parse(raw.toString("utf8")) as { id?: string; type?: string; data?: { object?: { id?: string; status?: string } } };
      if (!event.id || !event.type) return res.status(400).json({ error: "Invalid Stripe event" });
      const result = await recordPaymentEvent({ providerEventId: event.id, eventType: event.type, summary: JSON.stringify({ objectId: event.data?.object?.id, status: event.data?.object?.status }) });
      if (!result.persisted) return res.status(503).json({ error: "Payment event store unavailable" });
      return res.json({ received: true, duplicate: result.duplicate });
    } catch (error) {
      console.error("[Stripe] Webhook processing failed", error);
      return res.status(400).json({ error: "Invalid Stripe payload" });
    }
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
