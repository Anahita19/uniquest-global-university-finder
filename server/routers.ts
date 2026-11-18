import { COOKIE_NAME } from "@shared/const";
import { catalogMeta, countries, deadlines, programMatches, scholarships } from "@shared/seed";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, type MessageContent } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getStudentProfile, listFavorites, registerDocument, saveStudentProfile, setFavorite } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";

const profileSchema = z.object({
  fullName: z.string().max(180).optional(),
  nationality: z.string().max(120).optional(),
  residence: z.string().max(120).optional(),
  age: z.string().max(8).optional(),
  email: z.string().email().optional().or(z.literal("")),
  degreeLevel: z.string().max(32).optional(),
  fieldOfStudy: z.string().max(160).optional(),
  university: z.string().max(180).optional(),
  previousCountry: z.string().max(120).optional(),
  gpa: z.string().max(32).optional(),
  gradingScale: z.string().max(16).optional(),
  graduationYear: z.string().max(8).optional(),
  languageTest: z.string().max(64).optional(),
  languageScore: z.string().max(32).optional(),
  annualBudget: z.string().max(32).optional(),
  totalBudget: z.string().max(32).optional(),
  proofOfFunds: z.string().max(32).optional(),
  budgetCurrency: z.string().max(8).optional(),
  preferredCountries: z.array(z.string()).max(30).optional(),
  preferredLanguage: z.string().max(64).optional(),
  intake: z.string().max(32).optional(),
  studyMode: z.string().max(32).optional(),
  scholarshipNeed: z.string().max(32).optional(),
  researchExperience: z.string().max(1000).optional(),
  workExperience: z.string().max(1000).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    snapshot: publicProcedure.query(() => ({ matches: programMatches, scholarships, deadlines, countries, meta: catalogMeta })),
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => getStudentProfile(ctx.user.id)),
    saveDraft: protectedProcedure.input(profileSchema).mutation(async ({ ctx, input }) => {
      const result = await saveStudentProfile(ctx.user.id, input);
      return { ...result, profile: input };
    }),
  }),
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => listFavorites(ctx.user.id)),
    set: protectedProcedure.input(z.object({ entityType: z.string().max(32), entityId: z.string().max(128), saved: z.boolean() })).mutation(({ ctx, input }) => setFavorite({ userId: ctx.user.id, ...input })),
  }),
  documents: router({
    uploadAndAnalyze: protectedProcedure.input(z.object({
      fileName: z.string().min(1).max(255),
      mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
      dataBase64: z.string().min(1).max(18_000_000),
      documentType: z.string().max(64).default("transcript"),
    })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.dataBase64, "base64");
      if (bytes.byteLength > 12 * 1024 * 1024) {
        return { status: "rejected", message: "Transcript files must be 12 MB or smaller." } as const;
      }
      try {
        const extension = input.mimeType === "application/pdf" ? ".pdf" : input.mimeType === "image/png" ? ".png" : ".jpg";
        const uploaded = await storagePut(`users/${ctx.user.id}/documents/${nanoid(14)}${extension}`, bytes, input.mimeType);
        let extractedData: Record<string, unknown> | undefined;
        let extractionStatus: "pending" | "review" | "complete" | "failed" = "pending";
        try {
          const signedUrl = await storageGetSignedUrl(uploaded.key);
          const content: MessageContent[] = input.mimeType === "application/pdf"
            ? [
                { type: "text", text: "Read this academic transcript. Extract only information visible in the document. Return a structured academic profile with degree, major, GPA, grading scale, graduation date, courses with grades, and missing or unclear information. Never infer a grade that is not visible. The result will be reviewed by the applicant." },
                { type: "file_url", file_url: { url: signedUrl, mime_type: "application/pdf" } },
              ]
            : [
                { type: "text", text: "Read this academic transcript image. Extract only information visible in the document. Return degree, major, GPA, grading scale, graduation date, courses with grades, and missing or unclear information. Never infer a grade that is not visible. The result will be reviewed by the applicant." },
                { type: "image_url", image_url: { url: signedUrl, detail: "high" } },
              ];
          const response = await invokeLLM({
            messages: [{ role: "user", content }],
            maxTokens: 1000,
            outputSchema: {
              name: "transcript_profile",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  degree: { type: "string" },
                  major: { type: "string" },
                  gpa: { type: "string" },
                  gradingScale: { type: "string" },
                  graduationDate: { type: "string" },
                  courses: { type: "array", items: { type: "string" } },
                  missingOrUnclear: { type: "array", items: { type: "string" } },
                },
                required: ["degree", "major", "gpa", "gradingScale", "graduationDate", "courses", "missingOrUnclear"],
              },
            },
          });
          const raw = response.choices?.[0]?.message?.content;
          if (typeof raw === "string" && raw.trim()) {
            extractedData = JSON.parse(raw) as Record<string, unknown>;
            extractionStatus = "review";
          }
        } catch (error) {
          console.warn("[Documents] AI extraction unavailable; manual review required", error);
          extractionStatus = "review";
        }
        const persisted = await registerDocument({
          userId: ctx.user.id,
          documentType: input.documentType,
          fileName: input.fileName,
          storageKey: uploaded.key,
          storageUrl: uploaded.url,
          extractionStatus,
          extractedData: extractedData ? JSON.stringify(extractedData) : undefined,
        });
        return { status: extractionStatus, persisted: persisted.persisted, storageUrl: uploaded.url, extractedData } as const;
      } catch (error) {
        console.warn("[Documents] Upload integration unavailable", error);
        return { status: "integration-required", message: "Secure storage is not configured in this environment; keep the local draft and configure Manus Storage before publishing." } as const;
      }
    }),
  }),
  assistant: router({
    ask: publicProcedure.input(z.object({
      question: z.string().min(1).max(500),
      language: z.enum(["en", "fa"]).default("en"),
      profile: z.object({
        degreeLevel: z.string().max(64).optional(),
        fieldOfStudy: z.string().max(160).optional(),
        gpa: z.string().max(32).optional(),
        languageTest: z.string().max(64).optional(),
        languageScore: z.string().max(32).optional(),
        annualBudget: z.string().max(32).optional(),
        budgetCurrency: z.string().max(8).optional(),
        preferredCountries: z.array(z.string()).max(30).optional(),
      }).optional(),
    })).mutation(async ({ input }) => {
      const profile = input.profile ?? {};
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: input.language === "fa" ? "شما دستیار پذیرش بین‌المللی UniQuest هستید. فقط از زمینه ارائه‌شده استفاده کنید، هرگز پذیرش را تضمین نکنید، و به دانشجو بگویید شهریه و مهلت‌ها را در منابع رسمی بررسی کند. پاسخ را کوتاه، کاربردی و به زبان فارسی بنویسید. نام رسمی دانشگاه‌ها، رشته‌ها و بورسیه‌ها را به شکل اصلی نگه دارید." : "You are UniQuest, a cautious international admissions assistant. Use only the provided context, never guarantee admission, and explicitly tell the student to verify current official sources for fees and deadlines. Keep answers concise and actionable in English. Preserve official university, programme, and scholarship names." },
            { role: "user", content: `Student context: ${JSON.stringify(profile)}. Current source-linked options: ${programMatches.map(item => `${item.university} — ${item.program} — ${item.tier} — ${item.tuition} — ${item.deadline}`).join("; ")}\nQuestion: ${input.question}` },
          ],
          maxTokens: 450,
        });
        const content = response.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          return { answer: content.trim(), question: input.question, sourceIds: programMatches.slice(0, 2).map(item => item.id), integrationStatus: "Live Manus AI response" };
        }
      } catch (error) {
        console.warn("[Assistant] Live LLM unavailable; returning transparent fallback", error);
      }
      return {
        answer: input.language === "fa" ? "از گزینه‌های Safe و Good match شروع کنید و سپس شهریه، نمره‌های بخش‌های زبان و نزدیک‌ترین مهلت را در صفحه رسمی رشته بررسی کنید. این راهنما تقریبی است و احتمال رسمی پذیرش محسوب نمی‌شود." : "Start with the Safe and Good match bands, then verify the official program page for fees, section scores, and the next deadline. This is an indicative guide, not an official acceptance probability.",
        question: input.question,
        sourceIds: programMatches.slice(0, 2).map(item => item.id),
        integrationStatus: input.language === "fa" ? "سرویس زنده هوش مصنوعی در این محیط در دسترس نیست؛ پاسخ جایگزین شفاف نمایش داده شد." : "Live AI service unavailable in this environment; transparent fallback shown.",
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
