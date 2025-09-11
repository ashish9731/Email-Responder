import { storage } from '../storage';
import type { InsertEmailCase, EmailCase } from '@shared/schema';

export class CaseManager {
  async createCase(caseData: InsertEmailCase): Promise<EmailCase> {
    try {
      const newCase = await storage.createEmailCase(caseData);
      console.log(`Created new case: ${newCase.caseNumber}`);
      return newCase;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  }

  async updateCase(id: string, updates: Partial<EmailCase>): Promise<EmailCase> {
    try {
      const updatedCase = await storage.updateEmailCase(id, updates);
      console.log(`Updated case: ${updatedCase.caseNumber}`);
      return updatedCase;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  }

  async getCase(id: string): Promise<EmailCase | undefined> {
    return await storage.getEmailCase(id);
  }

  async getCaseByNumber(caseNumber: string): Promise<EmailCase | undefined> {
    return await storage.getEmailCaseByNumber(caseNumber);
  }

  async getAllCases(): Promise<EmailCase[]> {
    return await storage.getAllEmailCases();
  }

  async getActiveCases(): Promise<EmailCase[]> {
    const allCases = await storage.getAllEmailCases();
    return allCases.filter(c => c.status !== 'completed');
  }

  async completeCase(id: string): Promise<EmailCase> {
    return await this.updateCase(id, { status: 'completed' });
  }

  async getCaseStats() {
    const allCases = await storage.getAllEmailCases();
    const activeCases = allCases.filter(c => c.status !== 'completed');
    const respondedCases = allCases.filter(c => c.status === 'responded' || c.status === 'follow_up_sent' || c.status === 'completed');
    
    const responseRate = allCases.length > 0 
      ? ((respondedCases.length / allCases.length) * 100).toFixed(1) + '%'
      : '0%';

    return {
      total: allCases.length,
      active: activeCases.length,
      completed: allCases.filter(c => c.status === 'completed').length,
      responseRate,
      pendingFollowUps: allCases.filter(c => 
        c.status === 'responded' && 
        !c.followUpSent && 
        c.followUpAt && 
        new Date() >= c.followUpAt
      ).length
    };
  }
}

export const caseManager = new CaseManager();
