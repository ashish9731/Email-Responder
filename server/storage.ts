import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  Configuration,
  EmailCase,
  Keyword,
  MicrosoftCredentials,
  SystemStatus,
  InsertConfiguration,
  InsertEmailCase,
  InsertKeyword,
  InsertMicrosoftCredentials
} from '@shared/schema';

export class PersistentStorage {
  private dataDir = path.join(process.cwd(), 'data');
  private dataFile = path.join(this.dataDir, 'storage.json');
  
  private configurations = new Map<string, Configuration>();
  private emailCases = new Map<string, EmailCase>();
  private keywords = new Map<string, Keyword>();
  private microsoftCredentials = new Map<string, MicrosoftCredentials>();
  private systemStatuses = new Map<string, SystemStatus>();
  
  private currentConfigId: string | null = null;
  private currentStatusId: string | null = null;
  private currentMsCredId: string | null = null;

  constructor() {
    this.ensureDataDir();
    this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        
        this.configurations = new Map(data.configurations || []);
        this.emailCases = new Map(data.emailCases || []);
        this.keywords = new Map(data.keywords || []);
        this.microsoftCredentials = new Map(data.microsoftCredentials || []);
        this.systemStatuses = new Map(data.systemStatuses || []);
        
        this.currentConfigId = data.currentConfigId || null;
        this.currentStatusId = data.currentStatusId || null;
        this.currentMsCredId = data.currentMsCredId || null;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private saveData() {
    try {
      const data = {
        configurations: Array.from(this.configurations.entries()),
        emailCases: Array.from(this.emailCases.entries()),
        keywords: Array.from(this.keywords.entries()),
        microsoftCredentials: Array.from(this.microsoftCredentials.entries()),
        systemStatuses: Array.from(this.systemStatuses.entries()),
        currentConfigId: this.currentConfigId,
        currentStatusId: this.currentStatusId,
        currentMsCredId: this.currentMsCredId
      };
      
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const count = this.emailCases.size + 1;
    return `VE-${year}-${String(count).padStart(3, '0')}`;
  }

  // Configuration methods
  async saveConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const id = this.generateId();
    const newConfig: Configuration = {
      ...config,
      id,
      createdAt: new Date()
    };
    
    this.configurations.set(id, newConfig);
    this.currentConfigId = id;
    this.saveData();
    return newConfig;
  }

  async getConfiguration(): Promise<Configuration | undefined> {
    if (!this.currentConfigId) return undefined;
    return this.configurations.get(this.currentConfigId);
  }

  async updateConfiguration(updates: Partial<Configuration>): Promise<Configuration> {
    if (!this.currentConfigId) {
      throw new Error("No configuration exists to update");
    }
    
    const existing = this.configurations.get(this.currentConfigId);
    if (!existing) {
      throw new Error("Configuration not found");
    }
    
    const updated = { ...existing, ...updates };
    this.configurations.set(this.currentConfigId, updated);
    this.saveData();
    return updated;
  }

  // Email case methods
  async createEmailCase(emailCase: InsertEmailCase): Promise<EmailCase> {
    const id = this.generateId();
    const caseNumber = this.generateCaseNumber();
    const now = new Date();
    
    const newCase: EmailCase = {
      id,
      caseNumber,
      senderEmail: emailCase.senderEmail,
      senderName: emailCase.senderName || null,
      subject: emailCase.subject,
      originalBody: emailCase.originalBody,
      keywords: emailCase.keywords || [],
      status: 'new',
      responseBody: null,
      attachmentUrl: null,
      followUpSent: false,
      followUpAt: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.emailCases.set(id, newCase);
    this.saveData();
    return newCase;
  }

  async updateEmailCase(id: string, updates: Partial<EmailCase>): Promise<EmailCase> {
    const existing = this.emailCases.get(id);
    if (!existing) {
      throw new Error("Email case not found");
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.emailCases.set(id, updated);
    this.saveData();
    return updated;
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

  // System status methods
  async getSystemStatus(): Promise<SystemStatus | undefined> {
    if (!this.currentStatusId) return undefined;
    return this.systemStatuses.get(this.currentStatusId);
  }

  async updateSystemStatus(status: Partial<SystemStatus>): Promise<SystemStatus> {
    if (!this.currentStatusId) {
      const id = this.generateId();
      const newStatus: SystemStatus = {
        id,
        emailMonitorActive: false,
        outlookConnected: false,
        onedriveConnected: false,
        lastUpdated: new Date()
      };
      this.systemStatuses.set(id, { ...newStatus, ...status });
      this.currentStatusId = id;
      this.saveData();
      return this.systemStatuses.get(id)!;
    }
    
    const existing = this.systemStatuses.get(this.currentStatusId);
    if (!existing) {
      throw new Error("System status not found");
    }
    
    const updated = { ...existing, ...status, lastUpdated: new Date() };
    this.systemStatuses.set(this.currentStatusId, updated);
    this.saveData();
    return updated;
  }

  // Keyword methods
  async getAllKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values());
  }

  async addKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const id = this.generateId();
    const newKeyword: Keyword = {
      ...keyword,
      id,
      isActive: keyword.isActive !== undefined ? keyword.isActive : true,
      createdAt: new Date()
    };
    
    this.keywords.set(id, newKeyword);
    this.saveData();
    return newKeyword;
  }

  async removeKeyword(id: string): Promise<void> {
    this.keywords.delete(id);
    this.saveData();
  }

  async getActiveKeywords(): Promise<string[]> {
    return Array.from(this.keywords.values())
      .filter(k => k.isActive)
      .map(k => k.keyword);
  }

  // Microsoft credentials methods
  async getMicrosoftCredentials(): Promise<MicrosoftCredentials | undefined> {
    if (!this.currentMsCredId) return undefined;
    return this.microsoftCredentials.get(this.currentMsCredId);
  }

  async saveMicrosoftCredentials(credentials: InsertMicrosoftCredentials): Promise<MicrosoftCredentials> {
    const id = this.generateId();
    const now = new Date();
    
    const newCredentials: MicrosoftCredentials = {
      id,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      tenantId: credentials.tenantId,
      tokenCache: null,
      connectionType: credentials.connectionType,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    this.microsoftCredentials.set(id, newCredentials);
    this.currentMsCredId = id;
    this.saveData();
    return newCredentials;
  }

  async updateMicrosoftCredentials(credentials: Partial<MicrosoftCredentials>): Promise<MicrosoftCredentials> {
    if (!this.currentMsCredId) {
      throw new Error("No Microsoft credentials exist to update");
    }
    
    const existing = this.microsoftCredentials.get(this.currentMsCredId);
    if (!existing) {
      throw new Error("Microsoft credentials not found");
    }
    
    const updated = { ...existing, ...credentials, updatedAt: new Date() };
    this.microsoftCredentials.set(this.currentMsCredId, updated);
    this.saveData();
    return updated;
  }

  async deleteMicrosoftCredentials(): Promise<void> {
    if (this.currentMsCredId) {
      this.microsoftCredentials.delete(this.currentMsCredId);
      this.currentMsCredId = null;
      this.saveData();
    }
  }
}

export const storage = new PersistentStorage();
