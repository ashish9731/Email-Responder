import { 
  type Configuration, 
  type InsertConfiguration,
  type EmailCase,
  type InsertEmailCase,
  type SystemStatus,
  type InsertSystemStatus,
  type Keyword,
  type InsertKeyword,
  type MicrosoftCredentials,
  type InsertMicrosoftCredentials
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Configuration methods
  getConfiguration(): Promise<Configuration | undefined>;
  saveConfiguration(config: InsertConfiguration): Promise<Configuration>;
  updateConfiguration(config: Partial<Configuration>): Promise<Configuration>;
  
  // Email case methods
  createEmailCase(emailCase: InsertEmailCase): Promise<EmailCase>;
  getEmailCase(id: string): Promise<EmailCase | undefined>;
  getEmailCaseByNumber(caseNumber: string): Promise<EmailCase | undefined>;
  getAllEmailCases(): Promise<EmailCase[]>;
  updateEmailCase(id: string, updates: Partial<EmailCase>): Promise<EmailCase>;
  
  // System status methods
  getSystemStatus(): Promise<SystemStatus | undefined>;
  updateSystemStatus(status: Partial<SystemStatus>): Promise<SystemStatus>;
  
  // Keywords methods
  getAllKeywords(): Promise<Keyword[]>;
  addKeyword(keyword: InsertKeyword): Promise<Keyword>;
  removeKeyword(id: string): Promise<void>;
  getActiveKeywords(): Promise<string[]>;
  
  // Microsoft credentials methods
  getMicrosoftCredentials(): Promise<MicrosoftCredentials | undefined>;
  saveMicrosoftCredentials(credentials: InsertMicrosoftCredentials): Promise<MicrosoftCredentials>;
  updateMicrosoftCredentials(credentials: Partial<MicrosoftCredentials>): Promise<MicrosoftCredentials>;
  deleteMicrosoftCredentials(): Promise<void>;
}

export class MemStorage implements IStorage {
  private configurations: Map<string, Configuration> = new Map();
  private emailCases: Map<string, EmailCase> = new Map();
  private systemStatuses: Map<string, SystemStatus> = new Map();
  private keywords: Map<string, Keyword> = new Map();
  private microsoftCredentials: Map<string, MicrosoftCredentials> = new Map();
  private currentConfigId: string | null = null;
  private currentStatusId: string | null = null;
  private currentMsCredId: string | null = null;

  constructor() {
    // Initialize system status
    const statusId = randomUUID();
    this.currentStatusId = statusId;
    this.systemStatuses.set(statusId, {
      id: statusId,
      emailMonitorActive: false,
      autoResponderActive: false,
      outlookConnected: false,
      onedriveConnected: false,
      lastEmailCheck: null,
      emailsProcessed: 0,
      activeCases: 0,
      responseRate: "0%",
      storageUsed: "0GB",
      uptime: 0,
      lastUpdated: new Date(),
    });
  }

  async getConfiguration(): Promise<Configuration | undefined> {
    if (!this.currentConfigId) return undefined;
    return this.configurations.get(this.currentConfigId);
  }

  async saveConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const id = this.currentConfigId || randomUUID();
    const configuration: Configuration = {
      ...config,
      id,
      popServer: config.popServer || null,
      popPort: config.popPort || null,
      graphAppId: config.graphAppId || null,
      graphClientSecret: config.graphClientSecret || null,
      graphTenantId: config.graphTenantId || null,
      openaiApiKey: config.openaiApiKey || null,
      isActive: config.isActive || false,
      createdAt: new Date(),
    };
    
    this.configurations.set(id, configuration);
    this.currentConfigId = id;
    return configuration;
  }

  async updateConfiguration(config: Partial<Configuration>): Promise<Configuration> {
    if (!this.currentConfigId) {
      throw new Error("No configuration exists to update");
    }
    
    const existing = this.configurations.get(this.currentConfigId);
    if (!existing) {
      throw new Error("Configuration not found");
    }
    
    const updated = { ...existing, ...config };
    this.configurations.set(this.currentConfigId, updated);
    return updated;
  }

  async createEmailCase(emailCase: InsertEmailCase): Promise<EmailCase> {
    const id = randomUUID();
    const caseNumber = `VE-${new Date().getFullYear()}-${String(this.emailCases.size + 1).padStart(3, '0')}`;
    
    const newCase: EmailCase = {
      ...emailCase,
      id,
      caseNumber,
      senderName: emailCase.senderName || null,
      responseBody: emailCase.responseBody || null,
      attachmentUrl: emailCase.attachmentUrl || null,
      followUpSent: emailCase.followUpSent || false,
      followUpAt: emailCase.followUpAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.emailCases.set(id, newCase);
    return newCase;
  }

  async getEmailCase(id: string): Promise<EmailCase | undefined> {
    return this.emailCases.get(id);
  }

  async getEmailCaseByNumber(caseNumber: string): Promise<EmailCase | undefined> {
    return Array.from(this.emailCases.values()).find(c => c.caseNumber === caseNumber);
  }

  async getAllEmailCases(): Promise<EmailCase[]> {
    return Array.from(this.emailCases.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async updateEmailCase(id: string, updates: Partial<EmailCase>): Promise<EmailCase> {
    const existing = this.emailCases.get(id);
    if (!existing) {
      throw new Error("Email case not found");
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.emailCases.set(id, updated);
    return updated;
  }

  async getSystemStatus(): Promise<SystemStatus | undefined> {
    if (!this.currentStatusId) return undefined;
    return this.systemStatuses.get(this.currentStatusId);
  }

  async updateSystemStatus(status: Partial<SystemStatus>): Promise<SystemStatus> {
    if (!this.currentStatusId) {
      throw new Error("No system status exists to update");
    }
    
    const existing = this.systemStatuses.get(this.currentStatusId);
    if (!existing) {
      throw new Error("System status not found");
    }
    
    const updated = { ...existing, ...status, lastUpdated: new Date() };
    this.systemStatuses.set(this.currentStatusId, updated);
    return updated;
  }

  async getAllKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values());
  }

  async addKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const id = randomUUID();
    const newKeyword: Keyword = {
      ...keyword,
      id,
      isActive: keyword.isActive !== undefined ? keyword.isActive : true,
      createdAt: new Date(),
    };
    
    this.keywords.set(id, newKeyword);
    return newKeyword;
  }

  async removeKeyword(id: string): Promise<void> {
    this.keywords.delete(id);
  }

  async getActiveKeywords(): Promise<string[]> {
    return Array.from(this.keywords.values())
      .filter(k => k.isActive)
      .map(k => k.keyword);
  }

  async getMicrosoftCredentials(): Promise<MicrosoftCredentials | undefined> {
    if (!this.currentMsCredId) return undefined;
    return this.microsoftCredentials.get(this.currentMsCredId);
  }

  async saveMicrosoftCredentials(credentials: InsertMicrosoftCredentials): Promise<MicrosoftCredentials> {
    const id = this.currentMsCredId || randomUUID();
    const microsoftCreds: MicrosoftCredentials = {
      ...credentials,
      id,
      tokenCache: (credentials.tokenCache || null) as string | null,
      isActive: credentials.isActive !== undefined ? credentials.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.microsoftCredentials.set(id, microsoftCreds);
    this.currentMsCredId = id;
    return microsoftCreds;
  }

  async updateMicrosoftCredentials(credentials: Partial<MicrosoftCredentials>): Promise<MicrosoftCredentials> {
    if (!this.currentMsCredId) {
      throw new Error("No Microsoft credentials exist to update");
    }
    
    const existing = this.microsoftCredentials.get(this.currentMsCredId);
    if (!existing) {
      throw new Error("Microsoft credentials not found");
    }
    
    const updated = { ...existing, ...credentials, tokenCache: credentials.tokenCache || existing.tokenCache, updatedAt: new Date() };
    this.microsoftCredentials.set(this.currentMsCredId, updated);
    return updated;
  }

  async deleteMicrosoftCredentials(): Promise<void> {
    if (this.currentMsCredId) {
      this.microsoftCredentials.delete(this.currentMsCredId);
      this.currentMsCredId = null;
    }
  }
}

export const storage = new MemStorage();
