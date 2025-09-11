import * as Imap from 'node-imap';
import { storage } from '../storage';
import { aiResponder } from './aiResponder';
import { caseManager } from './caseManager';

export class EmailMonitor {
  private imap: Imap | null = null;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  async start() {
    try {
      const config = await storage.getConfiguration();
      if (!config || !config.isActive) {
        throw new Error('No active configuration found');
      }

      this.imap = new Imap({
        user: config.email,
        password: config.password,
        host: config.imapServer,
        port: config.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      this.imap.once('ready', () => {
        console.log('IMAP connection ready');
        this.openInbox();
      });

      this.imap.once('error', (err: Error) => {
        console.error('IMAP error:', err);
        this.isRunning = false;
      });

      this.imap.once('end', () => {
        console.log('IMAP connection ended');
        this.isRunning = false;
      });

      this.imap.connect();
      this.isRunning = true;

      // Update system status
      await storage.updateSystemStatus({
        emailMonitorActive: true,
        lastEmailCheck: new Date()
      });

      // Set up periodic checking
      this.startPeriodicCheck();

    } catch (error) {
      console.error('Error starting email monitor:', error);
      throw error;
    }
  }

  private openInbox() {
    if (!this.imap) return;

    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('Error opening inbox:', err);
        return;
      }

      console.log('Inbox opened, monitoring for new emails...');
      this.checkForNewEmails();

      // Listen for new emails
      this.imap!.on('mail', () => {
        console.log('New email received');
        this.checkForNewEmails();
      });
    });
  }

  private async checkForNewEmails() {
    try {
      if (!this.imap) return;

      // Search for unread emails
      this.imap.search(['UNSEEN'], async (err, results) => {
        if (err) {
          console.error('Error searching emails:', err);
          return;
        }

        if (results && results.length > 0) {
          console.log(`Found ${results.length} unread emails`);
          await this.processEmails(results);
        }

        // Update last check time
        await storage.updateSystemStatus({
          lastEmailCheck: new Date()
        });
      });

    } catch (error) {
      console.error('Error checking for new emails:', error);
    }
  }

  private async processEmails(emailIds: number[]) {
    if (!this.imap) return;

    const keywords = await storage.getActiveKeywords();
    
    const fetch = this.imap.fetch(emailIds, {
      bodies: '',
      markSeen: false
    });

    fetch.on('message', (msg, seqno) => {
      let buffer = Buffer.alloc(0);
      
      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          buffer = Buffer.concat([buffer, chunk]);
        });
      });

      msg.once('end', async () => {
        try {
          const emailContent = buffer.toString('utf8');
          const { subject, from, body } = this.parseEmail(emailContent);
          
          // Check for engine-related keywords
          const foundKeywords = this.findKeywords(subject + ' ' + body, keywords);
          
          if (foundKeywords.length > 0) {
            console.log(`Engine-related email detected from ${from}`);
            console.log(`Keywords found: ${foundKeywords.join(', ')}`);
            
            // Create case and generate response
            const emailCase = await caseManager.createCase({
              senderEmail: from,
              subject,
              originalBody: body,
              keywords: foundKeywords,
              status: 'new',
              followUpSent: false,
              followUpAt: null,
              responseBody: null,
              attachmentUrl: null
            });

            // Generate and send AI response
            await aiResponder.generateAndSendResponse(emailCase);
            
            // Mark email as seen
            this.imap!.addFlags(seqno, ['\\Seen'], (err) => {
              if (err) console.error('Error marking email as seen:', err);
            });

            // Update stats
            const status = await storage.getSystemStatus();
            if (status) {
              await storage.updateSystemStatus({
                emailsProcessed: status.emailsProcessed + 1,
                activeCases: (await storage.getAllEmailCases()).filter(c => c.status !== 'completed').length
              });
            }
          }
        } catch (error) {
          console.error('Error processing email:', error);
        }
      });
    });

    fetch.once('error', (err) => {
      console.error('Fetch error:', err);
    });
  }

  private parseEmail(content: string): { subject: string; from: string; body: string } {
    const lines = content.split('\n');
    let subject = '';
    let from = '';
    let bodyStart = false;
    let body = '';

    for (const line of lines) {
      if (line.startsWith('Subject: ')) {
        subject = line.substring(9).trim();
      } else if (line.startsWith('From: ')) {
        from = line.substring(6).trim();
        // Extract email from "Name <email>" format
        const emailMatch = from.match(/<([^>]+)>/);
        if (emailMatch) {
          from = emailMatch[1];
        }
      } else if (line.trim() === '' && !bodyStart) {
        bodyStart = true;
      } else if (bodyStart) {
        body += line + '\n';
      }
    }

    return { subject, from, body: body.trim() };
  }

  private findKeywords(text: string, keywords: string[]): string[] {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  private startPeriodicCheck() {
    // Check for follow-ups every 2 hours
    this.checkInterval = setInterval(async () => {
      await this.checkForFollowUps();
    }, 2 * 60 * 60 * 1000); // 2 hours
  }

  private async checkForFollowUps() {
    try {
      const cases = await storage.getAllEmailCases();
      const now = new Date();
      
      for (const emailCase of cases) {
        if (emailCase.status === 'responded' && 
            !emailCase.followUpSent && 
            emailCase.followUpAt && 
            now >= emailCase.followUpAt) {
          
          console.log(`Sending follow-up for case ${emailCase.caseNumber}`);
          await aiResponder.sendFollowUp(emailCase);
        }
      }
    } catch (error) {
      console.error('Error checking for follow-ups:', error);
    }
  }

  async stop() {
    try {
      this.isRunning = false;
      
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      if (this.imap) {
        this.imap.end();
        this.imap = null;
      }

      await storage.updateSystemStatus({
        emailMonitorActive: false
      });

      console.log('Email monitor stopped');
    } catch (error) {
      console.error('Error stopping email monitor:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasConnection: this.imap !== null
    };
  }
}

export const emailMonitor = new EmailMonitor();
