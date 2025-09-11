import { 
  type Configuration, 
  type InsertConfiguration,
  type EmailCase,
  type InsertEmailCase,
  type SystemStatus,
  type InsertSystemStatus,
  type Keyword,
  type InsertKeyword
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
}

export class MemStorage implements IStorage {
  private configurations: Map<string, Configuration> = new Map();
  private emailCases: Map<string, EmailCase> = new Map();
  private systemStatuses: Map<string, SystemStatus> = new Map();
  private keywords: Map<string, Keyword> = new Map();
  private currentConfigId: string | null = null;
  private currentStatusId: string | null = null;

  constructor() {
    // Initialize with default keywords
    const defaultKeywords = [
      "engine failure", "engine damaged", "engine fire", "engine broken", 
      "engine rusted", "engine malfunction", "engine issues", "vessel engine"
    ];
    
    defaultKeywords.forEach(kw => {
      const id = randomUUID();
      this.keywords.set(id, {
        id,
        keyword: kw,
        isActive: true,
        createdAt: new Date(),
      });
    });

    // Initialize system status
    const statusId = randomUUID();
    this.currentStatusId = statusId;
    this.systemStatuses.set(statusId, {
      id: statusId,
      emailMonitorActive: false,
      autoResponderActive: false,
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
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
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
}

export const storage = new MemStorage();
