import { z } from 'zod';

// Configuration schema
export const configurationSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  tenantId: z.string(),
  createdAt: z.date()
});

export const insertConfigurationSchema = configurationSchema.omit({ id: true, createdAt: true });

// Email case schema
export const emailCaseSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  senderEmail: z.string(),
  senderName: z.string().nullable(),
  subject: z.string(),
  originalBody: z.string(),
  keywords: z.array(z.string()),
  status: z.enum(['new', 'responded', 'follow_up_sent', 'completed']),
  responseBody: z.string().nullable(),
  attachmentUrl: z.string().nullable(),
  followUpSent: z.boolean().default(false),
  followUpAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertEmailCaseSchema = emailCaseSchema.omit({ 
  id: true, 
  caseNumber: true, 
  status: true, 
  responseBody: true, 
  attachmentUrl: true, 
  followUpSent: true, 
  followUpAt: true, 
  createdAt: true, 
  updatedAt: true 
});

// Keyword schema
export const keywordSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date()
});

export const insertKeywordSchema = keywordSchema.omit({ id: true, createdAt: true });

// Microsoft credentials schema
export const microsoftCredentialsSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  tenantId: z.string(),
  tokenCache: z.string().nullable(),
  connectionType: z.enum(['oauth', 'manual']),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertMicrosoftCredentialsSchema = microsoftCredentialsSchema.omit({ 
  id: true, 
  tokenCache: true, 
  isActive: true, 
  createdAt: true, 
  updatedAt: true 
});

// System status schema
export const systemStatusSchema = z.object({
  id: z.string(),
  emailMonitorActive: z.boolean().default(false),
  outlookConnected: z.boolean().default(false),
  onedriveConnected: z.boolean().default(false),
  lastUpdated: z.date()
});

export const insertSystemStatusSchema = systemStatusSchema.omit({ id: true, lastUpdated: true });

// Type exports
export type Configuration = z.infer<typeof configurationSchema>;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;

export type EmailCase = z.infer<typeof emailCaseSchema>;
export type InsertEmailCase = z.infer<typeof insertEmailCaseSchema>;

export type Keyword = z.infer<typeof keywordSchema>;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;

export type MicrosoftCredentials = z.infer<typeof microsoftCredentialsSchema>;
export type InsertMicrosoftCredentials = z.infer<typeof insertMicrosoftCredentialsSchema>;

export type SystemStatus = z.infer<typeof systemStatusSchema>;
export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
