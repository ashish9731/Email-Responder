import OpenAI from "openai";
import { storage } from '../storage';
import { sendEmailWithAttachment } from '../outlookClient';
import { uploadChecklistFile, saveEmailResponse } from '../onedriveClient';
import type { EmailCase } from '@shared/schema';

export class AIResponder {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || "default_key"
    });
  }

  async generateAndSendResponse(emailCase: EmailCase) {
    try {
      console.log(`Generating AI response for case ${emailCase.caseNumber}`);

      // Generate checklist content
      const checklistContent = await this.generateChecklist(emailCase);
      
      // Upload checklist to OneDrive
      const checklistFile = await uploadChecklistFile(emailCase.caseNumber, checklistContent);
      
      // Generate email response
      const responseBody = await this.generateEmailResponse(emailCase);
      
      // Send email with attachment
      await sendEmailWithAttachment(
        emailCase.senderEmail,
        `Re: ${emailCase.subject} - Case #${emailCase.caseNumber}`,
        responseBody,
        checklistFile.webUrl
      );

      // Save email response to OneDrive
      await saveEmailResponse(emailCase.caseNumber, responseBody);

      // Update case status
      await storage.updateEmailCase(emailCase.id, {
        status: 'responded',
        responseBody,
        attachmentUrl: checklistFile.webUrl,
        followUpAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      });

      // Update system status
      await storage.updateSystemStatus({
        autoResponderActive: true
      });

      console.log(`Response sent successfully for case ${emailCase.caseNumber}`);

    } catch (error) {
      console.error('Error generating and sending response:', error);
      
      // Update case with error status
      await storage.updateEmailCase(emailCase.id, {
        status: 'error'
      });
      
      throw error;
    }
  }

  private async generateEmailResponse(emailCase: EmailCase): Promise<string> {
    const prompt = `
    Generate a professional, empathetic email response for a vessel engine-related inquiry. 

    Original Email Details:
    - Subject: ${emailCase.subject}
    - From: ${emailCase.senderEmail}
    - Keywords detected: ${emailCase.keywords.join(', ')}
    - Original message: ${emailCase.originalBody}

    Guidelines:
    1. Be professional and understanding
    2. Acknowledge the urgency of engine issues
    3. Reference the attached engine inspection checklist
    4. Encourage following the checklist step by step
    5. Mention that a follow-up will be sent in 2 hours
    6. Include the case number: ${emailCase.caseNumber}
    7. Use HTML formatting for better readability

    Generate a complete email response in HTML format.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional maritime safety expert specializing in vessel engine issues. Generate helpful, actionable email responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    return response.choices[0].message.content || "Thank you for your inquiry regarding the engine issue. We have received your message and assigned case number " + emailCase.caseNumber + ". Please find the attached checklist for immediate inspection steps.";
  }

  private async generateChecklist(emailCase: EmailCase): Promise<string> {
    const prompt = `
    Generate a comprehensive engine inspection checklist based on the following details:
    
    - Issue keywords: ${emailCase.keywords.join(', ')}
    - Subject: ${emailCase.subject}
    - Case: ${emailCase.caseNumber}

    Create a detailed, step-by-step checklist that covers:
    1. Safety precautions
    2. Visual inspection steps
    3. Operational checks
    4. Documentation requirements
    5. When to contact professionals

    Format as a clear, numbered checklist that can be printed and used in the field.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a maritime engineer creating safety checklists for vessel engine inspections. Be thorough and prioritize safety."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    return response.choices[0].message.content || `Engine Inspection Checklist - Case ${emailCase.caseNumber}\n\n1. Ensure engine is shut down and cool\n2. Check for visible damage\n3. Inspect fluid levels\n4. Document all findings\n5. Contact certified marine technician if issues persist`;
  }

  async sendFollowUp(emailCase: EmailCase) {
    try {
      const followUpBody = await this.generateFollowUpEmail(emailCase);
      
      await sendEmailWithAttachment(
        emailCase.senderEmail,
        `Follow-up: ${emailCase.subject} - Case #${emailCase.caseNumber}`,
        followUpBody
      );

      // Update case
      await storage.updateEmailCase(emailCase.id, {
        followUpSent: true,
        status: 'follow_up_sent'
      });

      console.log(`Follow-up sent for case ${emailCase.caseNumber}`);

    } catch (error) {
      console.error('Error sending follow-up:', error);
      throw error;
    }
  }

  private async generateFollowUpEmail(emailCase: EmailCase): Promise<string> {
    const prompt = `
    Generate a follow-up email for case ${emailCase.caseNumber} about ${emailCase.subject}.
    
    This is a 2-hour follow-up to check on progress and offer additional assistance.
    
    Guidelines:
    1. Ask about progress on the checklist
    2. Offer additional support
    3. Be professional and caring
    4. Include case number
    5. Use HTML formatting
    
    Keep it concise but helpful.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are following up on a vessel engine issue to ensure the customer has the support they need."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    return response.choices[0].message.content || `Following up on case ${emailCase.caseNumber}. We hope the inspection checklist has been helpful. Please let us know if you need additional assistance.`;
  }
}

export const aiResponder = new AIResponder();
