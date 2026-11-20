import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { ProgramMatch } from "../shared/seed";

const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: null });

describe("catalog search performance contract", () => {
  it("normalizes whitespace and searches university, programme, country, and field", async () => {
    const result = await caller.catalog.search({ query: "  COMPUTER   SCIENCE  ", limit: 20 });
    expect(result.query).toBe("computer science");
    expect(result.total).toBeGreaterThan(0);
    expect((result.matches as ProgramMatch[]).some(match => match.university === "Technical University of Munich")).toBe(true);
  });

  it("returns the full bounded catalog for an empty query", async () => {
    const result = await caller.catalog.search({ query: "", limit: 2 });
    expect(result.matches).toHaveLength(2);
    expect(result.total).toBe(4);
  });

  it("enforces the server-side result limit", async () => {
    const result = await caller.catalog.search({ query: "", limit: 50 });
    expect(result.matches.length).toBeLessThanOrEqual(50);
    expect(result.matches.length).toBe(result.total);
  });
});
