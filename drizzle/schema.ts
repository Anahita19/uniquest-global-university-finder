import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  fullName: varchar("fullName", { length: 180 }),
  degreeLevel: varchar("degreeLevel", { length: 32 }),
  fieldOfStudy: varchar("fieldOfStudy", { length: 160 }),
  gpa: varchar("gpa", { length: 32 }),
  gradingScale: varchar("gradingScale", { length: 16 }),
  languageTest: varchar("languageTest", { length: 64 }),
  languageScore: varchar("languageScore", { length: 32 }),
  budgetCurrency: varchar("budgetCurrency", { length: 8 }),
  annualBudget: varchar("annualBudget", { length: 32 }),
  preferredCountries: text("preferredCountries"),
  profileData: text("profileData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentType: varchar("documentType", { length: 64 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 255 }),
  storageUrl: varchar("storageUrl", { length: 512 }),
  extractionStatus: mysqlEnum("extractionStatus", ["pending", "review", "complete", "failed"]).default("pending").notNull(),
  extractedData: text("extractedData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const catalogSources = mysqlTable("catalog_sources", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 32 }).notNull(),
  entityId: varchar("entityId", { length: 128 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["Verified", "Estimated", "Unconfirmed"]).default("Unconfirmed").notNull(),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  notes: text("notes"),
});

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entityType: varchar("entityType", { length: 32 }).notNull(),
  entityId: varchar("entityId", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programId: varchar("programId", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["Interested", "Preparing documents", "Ready to apply", "Submitted", "Under review", "Interview", "Accepted", "Rejected", "Waitlisted"]).default("Interested").notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["FREE", "PRO", "PREMIUM"]).default("FREE").notNull(),
  provider: varchar("provider", { length: 32 }),
  providerSubscriptionId: varchar("providerSubscriptionId", { length: 255 }),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentEvents = mysqlTable("payment_events", {
  id: int("id").autoincrement().primaryKey(),
  providerEventId: varchar("providerEventId", { length: 255 }).notNull().unique(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
  summary: text("summary"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;
