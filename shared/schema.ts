import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configurations = pgTable("configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imapServer: text("imap_server").notNull(),
  imapPort: integer("imap_port").notNull(),
  popServer: text("pop_server"),
  popPort: integer("pop_port"),
  smtpServer: text("smtp_server").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  graphAppId: text("graph_app_id"),
  graphClientSecret: text("graph_client_secret"),
  graphTenantId: text("graph_tenant_id"),
  openaiApiKey: text("openai_api_key"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const emailCases = pgTable("email_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(),
  senderEmail: text("sender_email").notNull(),
  senderName: text("sender_name"),
  subject: text("subject").notNull(),
  originalBody: text("original_body").notNull(),
  keywords: json("keywords").$type<string[]>().notNull(),
  status: text("status").notNull(), // 'new', 'responded', 'follow_up_sent', 'completed'
  responseBody: text("response_body"),
  attachmentUrl: text("attachment_url"),
  followUpSent: boolean("follow_up_sent").default(false),
  followUpAt: timestamp("follow_up_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const systemStatus = pgTable("system_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailMonitorActive: boolean("email_monitor_active").default(false),
  autoResponderActive: boolean("auto_responder_active").default(false),
  outlookConnected: boolean("outlook_connected").default(false),
  onedriveConnected: boolean("onedrive_connected").default(false),
  lastEmailCheck: timestamp("last_email_check"),
  emailsProcessed: integer("emails_processed").default(0),
  activeCases: integer("active_cases").default(0),
  responseRate: text("response_rate").default("0%"),
  storageUsed: text("storage_used").default("0GB"),
  uptime: integer("uptime").default(0), // in seconds
  lastUpdated: timestamp("last_updated").default(sql`now()`),
});

export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const microsoftCredentials = pgTable("microsoft_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),
  tenantId: text("tenant_id").notNull(),
  tokenCache: text("token_cache"),
  connectionType: text("connection_type").notNull(), // 'manual' or 'integration'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  createdAt: true,
});

export const insertEmailCaseSchema = createInsertSchema(emailCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  caseNumber: true,
});

export const insertSystemStatusSchema = createInsertSchema(systemStatus).omit({
  id: true,
  lastUpdated: true,
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
});

export const insertMicrosoftCredentialsSchema = createInsertSchema(microsoftCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type EmailCase = typeof emailCases.$inferSelect;
export type InsertEmailCase = z.infer<typeof insertEmailCaseSchema>;
export type SystemStatus = typeof systemStatus.$inferSelect;
export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type MicrosoftCredentials = typeof microsoftCredentials.$inferSelect;
export type InsertMicrosoftCredentials = z.infer<typeof insertMicrosoftCredentialsSchema>;
