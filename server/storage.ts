import { kv } from '@vercel/kv';
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

export class VercelKVStorage {
  private readonly KV_PREFIX = 'email_responder';
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    return `VE-${year}-${timestamp.toString().slice(-4)}`;
  }

  private async getKey(type: string, id?: string): Promise<string> {
    return id ? `${this.KV_PREFIX}:${type}:${id}` : `${this.KV_PREFIX}:${type}`;
  }

  // Configuration methods
  async saveConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const id = this.generateId();
    const newConfig: Configuration = {
      ...config,
      id,
      createdAt: new Date()
    };
    
    await kv.set(await this.getKey('config', id), JSON.stringify(newConfig));
    await kv.set(await this.getKey('current_config'), id);
    return newConfig;
  }

  async getConfiguration(): Promise<Configuration | undefined> {
    const currentId = await kv.get(await this.getKey('current_config')) as string;
    if (!currentId) return undefined;
    
    const config = await kv.get(await this.getKey('config', currentId)) as string;
    return config ? JSON.parse(config) : undefined;
  }

  async updateConfiguration(updates: Partial<Configuration>): Promise<Configuration> {
    const current = await this.getConfiguration();
    if (!current) {
      throw new Error("No configuration exists to update");
    }
    
    const updated = { ...current, ...updates };
    await kv.set(await this.getKey('config', current.id), JSON.stringify(updated));
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
    
    await kv.set(await this.getKey('email_case', id), JSON.stringify(newCase));
    
    // Add to email cases list
    const cases = await this.getAllEmailCases();
    cases.unshift(newCase);
    await kv.set(await this.getKey('email_cases'), JSON.stringify(cases.map(c => [c.id, c])));
    
    return newCase;
  }

  async updateEmailCase(id: string, updates: Partial<EmailCase>): Promise<EmailCase> {
    const existingStr = await kv.get(await this.getKey('email_case', id)) as string;
    if (!existingStr) {
      throw new Error("Email case not found");
    }
    
    const existing = JSON.parse(existingStr);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    
    await kv.set(await this.getKey('email_case', id), JSON.stringify(updated));
    
    // Update in email cases list
    const cases = await this.getAllEmailCases();
    const index = cases.findIndex(c => c.id === id);
    if (index !== -1) {
      cases[index] = updated;
      await kv.set(await this.getKey('email_cases'), JSON.stringify(cases.map(c => [c.id, c])));
    }
    
    return updated;
  }

  async getEmailCase(id: string): Promise<EmailCase | undefined> {
    const caseStr = await kv.get(await this.getKey('email_case', id)) as string;
    return caseStr ? JSON.parse(caseStr) : undefined;
  }

  async getEmailCaseByNumber(caseNumber: string): Promise<EmailCase | undefined> {
    const cases = await this.getAllEmailCases();
    return cases.find(c => c.caseNumber === caseNumber);
  }

  async getAllEmailCases(): Promise<EmailCase[]> {
    const casesStr = await kv.get(await this.getKey('email_cases')) as string;
    if (!casesStr) return [];
    
    const cases = JSON.parse(casesStr);
    return cases.map(([id, caseData]: [string, EmailCase]) => caseData)
      .sort((a: EmailCase, b: EmailCase) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // System status methods
  async getSystemStatus(): Promise<SystemStatus | undefined> {
    const statusStr = await kv.get(await this.getKey('system_status')) as string;
    return statusStr ? JSON.parse(statusStr) : undefined;
  }

  async updateSystemStatus(status: Partial<SystemStatus>): Promise<SystemStatus> {
    const existing = await this.getSystemStatus();
    
    let updated: SystemStatus;
    if (!existing) {
      const id = this.generateId();
      updated = {
        id,
        emailMonitorActive: false,
        outlookConnected: false,
        onedriveConnected: false,
        lastUpdated: new Date(),
        ...status
      };
    } else {
      updated = { ...existing, ...status, lastUpdated: new Date() };
    }
    
    await kv.set(await this.getKey('system_status'), JSON.stringify(updated));
    return updated;
  }

  // Keyword methods
  async addKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const id = this.generateId();
    const newKeyword: Keyword = {
      ...keyword,
      id,
      createdAt: new Date()
    };
    
    await kv.set(await this.getKey('keyword', id), JSON.stringify(newKeyword));
    
    // Add to keywords list
    const keywords = await this.getAllKeywords();
    keywords.unshift(newKeyword);
    await kv.set(await this.getKey('keywords'), JSON.stringify(keywords.map(k => [k.id, k])));
    
    return newKeyword;
  }

  async removeKeyword(id: string): Promise<void> {
    await kv.del(await this.getKey('keyword', id));
    
    // Remove from keywords list
    const keywords = await this.getAllKeywords();
    const filtered = keywords.filter(k => k.id !== id);
    await kv.set(await this.getKey('keywords'), JSON.stringify(filtered.map(k => [k.id, k])));
  }

  async getAllKeywords(): Promise<Keyword[]> {
    const keywordsStr = await kv.get(await this.getKey('keywords')) as string;
    if (!keywordsStr) return [];
    
    const keywords = JSON.parse(keywordsStr);
    return keywords.map(([id, keyword]: [string, Keyword]) => keyword);
  }

  async getActiveKeywords(): Promise<string[]> {
    const keywords = await this.getAllKeywords();
    return keywords
      .filter(k => k.isActive !== false)
      .map(k => k.keyword);
  }

  // Microsoft credentials methods
  async saveMicrosoftCredentials(credentials: InsertMicrosoftCredentials): Promise<MicrosoftCredentials> {
    const id = this.generateId();
    const newCredentials: MicrosoftCredentials = {
      ...credentials,
      id,
      isActive: true,
      tokenCache: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await kv.set(await this.getKey('ms_credentials', id), JSON.stringify(newCredentials));
    await kv.set(await this.getKey('current_ms_credentials'), id);
    return newCredentials;
  }

  async getMicrosoftCredentials(): Promise<MicrosoftCredentials | undefined> {
    const currentId = await kv.get(await this.getKey('current_ms_credentials')) as string;
    if (!currentId) return undefined;
    
    const creds = await kv.get(await this.getKey('ms_credentials', currentId)) as string;
    return creds ? JSON.parse(creds) : undefined;
  }

  async updateMicrosoftCredentials(credentials: Partial<MicrosoftCredentials>): Promise<MicrosoftCredentials> {
    const current = await this.getMicrosoftCredentials();
    if (!current) {
      throw new Error("No Microsoft credentials exist to update");
    }
    
    const updated = { ...current, ...credentials, updatedAt: new Date() };
    await kv.set(await this.getKey('ms_credentials', current.id), JSON.stringify(updated));
    return updated;
  }

  async deleteMicrosoftCredentials(): Promise<boolean> {
    const currentId = await kv.get(await this.getKey('current_ms_credentials')) as string;
    if (!currentId) return false;
    
    await kv.del(await this.getKey('ms_credentials', currentId));
    await kv.del(await this.getKey('current_ms_credentials'));
    return true;
  }
}

export const storage = new VercelKVStorage();
