import { Client } from '@microsoft/microsoft-graph-client';
import { storage } from '../storage.js';
import { aiResponder } from './aiResponder.js';

export class EmailMonitor {
  private isRunning = false;
  private checkInterval = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    await storage.updateSystemStatus({ emailMonitorActive: true });
    
    this.intervalId = setInterval(async () => {
      await this.checkEmails();
    }, this.checkInterval);
    
    console.log('Email monitor started');
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    await storage.updateSystemStatus({ emailMonitorActive: false });
    console.log('Email monitor stopped');
  }

  async checkEmails() {
    try {
      const credentials = await storage.getMicrosoftCredentials();
      if (!credentials?.tokenCache) {
        console.log('No Microsoft credentials found');
        return;
      }

      const client = Client.init({
        authProvider: (done) => {
          done(null, credentials.tokenCache);
        }
      });

      const messages = await client
        .api('/me/messages')
        .filter('isRead eq false')
        .top(10)
        .get();

      for (const message of messages.value) {
        await this.processEmail(message, client);
      }
    } catch (error) {
      console.error('Error checking emails:', error);
    }
  }

  async processEmail(message: any, client: Client) {
    try {
      const activeKeywords = await storage.getActiveKeywords();
      if (activeKeywords.length === 0) return;

      const subject = message.subject || '';
      const body = message.body?.content || '';
      const senderEmail = message.from?.emailAddress?.address || '';
      const senderName = message.from?.emailAddress?.name || '';

      // Check both subject and body for keywords
      const subjectKeywords = this.extractKeywords(subject, activeKeywords);
      const bodyKeywords = this.extractKeywords(body, activeKeywords);
      const allKeywords = Array.from(new Set([...subjectKeywords, ...bodyKeywords]));

      if (allKeywords.length === 0) return;

      // Create email case
      const emailCase = await storage.createEmailCase({
        senderEmail,
        senderName,
        subject,
        originalBody: body,
        keywords: allKeywords
      });

      // Generate AI response
      const responseBody = await aiResponder.generateResponse(
        { subject, body, senderName, senderEmail },
        allKeywords
      );

      // Send response email
      await this.sendResponse(message, responseBody, client);

      // Update case status
      await storage.updateEmailCase(emailCase.id, {
        status: 'responded',
        responseBody
      });

      // Mark original email as read
      await this.markAsRead(message.id, client);

      console.log(`Processed email case: ${emailCase.caseNumber}`);

    } catch (error) {
      console.error('Error processing email:', error);
    }
  }

  async sendResponse(originalMessage: any, response: string, client: Client) {
    try {
      await client.api('/me/sendMail').post({
        message: {
          subject: `Re: ${originalMessage.subject}`,
          body: {
            contentType: 'HTML',
            content: response
          },
          toRecipients: [{
            emailAddress: {
              address: originalMessage.from.emailAddress.address
            }
          }]
        }
      });
    } catch (error) {
      console.error('Error sending response:', error);
      throw error;
    }
  }

  private async markAsRead(messageId: string, client: Client) {
    try {
      await client.api(`/me/messages/${messageId}`)
        .patch({ isRead: true });
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }

  private extractKeywords(text: string, keywords: string[]): string[] {
    const foundKeywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (lowerKeyword && lowerText.includes(lowerKeyword)) {
        foundKeywords.push(keyword);
      }
    }
    
    return Array.from(new Set(foundKeywords)); // Remove duplicates
  }
}

export const emailMonitor = new EmailMonitor();
