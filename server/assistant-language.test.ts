import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", async () => {
  const actual = await vi.importActual<typeof import("./_core/llm")>("./_core/llm");
  return { ...actual, invokeLLM: vi.fn() };
});

import { invokeLLM } from "./_core/llm";
import { appRouter } from "./routers";

const mockedInvokeLLM = vi.mocked(invokeLLM);
const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: null });

const profile = {
  degreeLevel: "Master's Degree",
  fieldOfStudy: "Computer Science",
  gpa: "3.55",
  languageTest: "IELTS Academic",
  languageScore: "7.0",
  annualBudget: "18000",
  budgetCurrency: "EUR",
  preferredCountries: ["Germany", "Netherlands"],
};

describe("assistant language contract", () => {
  beforeEach(() => {
    mockedInvokeLLM.mockReset();
  });

  it("sends a Persian system instruction and preserves the student context", async () => {
    mockedInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: "برای شروع، گزینه‌های Safe را بررسی کنید." } }],
    } as never);

    const result = await caller.assistant.ask({
      language: "fa",
      question: "از کدام دانشگاه شروع کنم؟",
      profile,
    });

    expect(result.answer).toContain("Safe");
    expect(result.integrationStatus).toBe("Live Manus AI response");
    expect(result.sourceIds).toHaveLength(2);

    const request = mockedInvokeLLM.mock.calls[0][0];
    expect(request.messages[0]).toMatchObject({ role: "system" });
    expect(String(request.messages[0].content)).toContain("به زبان فارسی");
    expect(String(request.messages[0].content)).toContain("هرگز پذیرش را تضمین نکنید");
    expect(String(request.messages[1].content)).toContain("از کدام دانشگاه شروع کنم؟");
    expect(String(request.messages[1].content)).toContain("Computer Science");
    expect(String(request.messages[1].content)).toContain("Germany");
  });

  it("sends an English system instruction when English is selected", async () => {
    mockedInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: "Start with the Good match band." } }],
    } as never);

    const result = await caller.assistant.ask({
      language: "en",
      question: "Where should I start?",
      profile,
    });

    expect(result.answer).toBe("Start with the Good match band.");
    const request = mockedInvokeLLM.mock.calls[0][0];
    expect(String(request.messages[0].content)).toContain("in English");
    expect(String(request.messages[0].content)).toContain("never guarantee admission");
    expect(String(request.messages[1].content)).toContain("Where should I start?");
  });

  it("defaults an omitted language to English for backward compatibility", async () => {
    mockedInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: "English default" } }],
    } as never);

    await caller.assistant.ask({ question: "What is the next step?" });

    const request = mockedInvokeLLM.mock.calls[0][0];
    expect(String(request.messages[0].content)).toContain("in English");
  });

  it("returns a Persian transparent fallback when the live AI service fails", async () => {
    mockedInvokeLLM.mockRejectedValue(new Error("provider unavailable"));

    const result = await caller.assistant.ask({
      language: "fa",
      question: "آیا این پذیرش تضمینی است؟",
      profile,
    });

    expect(result.answer).toContain("این راهنما تقریبی است");
    expect(result.answer).toContain("احتمال رسمی پذیرش");
    expect(result.integrationStatus).toContain("سرویس زنده هوش مصنوعی");
    expect(result.sourceIds).toHaveLength(2);
  });

  it("returns an English transparent fallback when the live AI service fails", async () => {
    mockedInvokeLLM.mockRejectedValue(new Error("provider unavailable"));

    const result = await caller.assistant.ask({
      language: "en",
      question: "Is admission guaranteed?",
    });

    expect(result.answer).toContain("indicative guide");
    expect(result.answer).toContain("not an official acceptance probability");
    expect(result.integrationStatus).toContain("transparent fallback shown");
  });

  it("rejects unsupported language values at the procedure boundary", async () => {
    await expect(caller.assistant.ask({
      language: "de" as "en",
      question: "What is next?",
    })).rejects.toThrow();
    expect(mockedInvokeLLM).not.toHaveBeenCalled();
  });

  it("serves repeated identical requests from the short-lived cache", async () => {
    mockedInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: "Cached answer" } }],
    } as never);

    const input = { language: "en" as const, question: "What is my cached next step?", profile };
    const first = await caller.assistant.ask(input);
    const second = await caller.assistant.ask(input);

    expect(first.answer).toBe("Cached answer");
    expect(second.answer).toBe("Cached answer");
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent identical requests while the model is pending", async () => {
    let resolveResponse: (value: unknown) => void = () => undefined;
    const pending = new Promise(resolve => { resolveResponse = resolve; });
    mockedInvokeLLM.mockReturnValue(pending as never);

    const input = { language: "en" as const, question: "What should I prioritize concurrently?", profile };
    const firstRequest = caller.assistant.ask(input);
    const secondRequest = caller.assistant.ask(input);
    resolveResponse({ choices: [{ message: { content: "One shared answer" } }] });
    const [first, second] = await Promise.all([firstRequest, secondRequest]);

    expect(first.answer).toBe("One shared answer");
    expect(second.answer).toBe("One shared answer");
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(1);
  });
});
