import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { documents, favorites, InsertUser, paymentEvents, studentProfiles, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = new Date();
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function saveStudentProfile(userId: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return { persisted: false };
  const values = {
    userId,
    fullName: typeof data.fullName === "string" ? data.fullName : null,
    degreeLevel: typeof data.degreeLevel === "string" ? data.degreeLevel : null,
    fieldOfStudy: typeof data.fieldOfStudy === "string" ? data.fieldOfStudy : null,
    gpa: typeof data.gpa === "string" ? data.gpa : null,
    gradingScale: typeof data.gradingScale === "string" ? data.gradingScale : null,
    languageTest: typeof data.languageTest === "string" ? data.languageTest : null,
    languageScore: typeof data.languageScore === "string" ? data.languageScore : null,
    budgetCurrency: typeof data.budgetCurrency === "string" ? data.budgetCurrency : null,
    annualBudget: typeof data.annualBudget === "string" ? data.annualBudget : null,
    preferredCountries: JSON.stringify(data.preferredCountries ?? []),
    profileData: JSON.stringify(data),
  };
  await db.insert(studentProfiles).values(values).onDuplicateKeyUpdate({ set: values });
  return { persisted: true };
}

export async function getStudentProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function registerDocument(data: {
  userId: number;
  documentType: string;
  fileName: string;
  storageKey: string;
  storageUrl: string;
  extractionStatus: "pending" | "review" | "complete" | "failed";
  extractedData?: string;
}) {
  const db = await getDb();
  if (!db) return { persisted: false };
  await db.insert(documents).values(data);
  return { persisted: true };
}

export async function recordPaymentEvent(data: { providerEventId: string; eventType: string; summary?: string }) {
  const db = await getDb();
  if (!db) return { persisted: false, duplicate: false };
  const existing = await db.select({ id: paymentEvents.id }).from(paymentEvents).where(eq(paymentEvents.providerEventId, data.providerEventId)).limit(1);
  if (existing.length) return { persisted: true, duplicate: true };
  await db.insert(paymentEvents).values(data);
  return { persisted: true, duplicate: false };
}

export async function listFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ entityId: favorites.entityId, entityType: favorites.entityType }).from(favorites).where(eq(favorites.userId, userId));
}

export async function setFavorite(data: { userId: number; entityType: string; entityId: string; saved: boolean }) {
  const db = await getDb();
  if (!db) return { persisted: false };
  if (data.saved) {
    const existing = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, data.userId), eq(favorites.entityType, data.entityType), eq(favorites.entityId, data.entityId))).limit(1);
    if (!existing.length) await db.insert(favorites).values({ userId: data.userId, entityType: data.entityType, entityId: data.entityId });
  } else {
    await db.delete(favorites).where(and(eq(favorites.userId, data.userId), eq(favorites.entityType, data.entityType), eq(favorites.entityId, data.entityId)));
  }
  return { persisted: true };
}
