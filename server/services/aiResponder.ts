import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIResponder {
  async generateResponse(
    emailContent: { subject: string; body: string; senderName: string; senderEmail: string },
    matchedKeywords: string[]
  ): Promise<string> {
    try {
      const prompt = this.buildPrompt(emailContent, matchedKeywords);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful email assistant that provides professional, concise responses to customer inquiries. Focus on being helpful, professional, and addressing the specific keywords mentioned in the email."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content?.trim() || this.getFallbackResponse(matchedKeywords);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackResponse(matchedKeywords);
    }
  }

  private buildPrompt(
    emailContent: { subject: string; body: string; senderName: string; senderEmail: string },
    keywords: string[]
  ): string {
    return `Please generate a professional email response for the following inquiry:

Subject: ${emailContent.subject}
Body: ${emailContent.body}
From: ${emailContent.senderName} (${emailContent.senderEmail})

The following keywords were detected in the email: ${keywords.join(', ')}

Please provide a helpful, professional response that addresses the inquiry and incorporates the detected keywords naturally. Keep the response concise but informative.`;
  }

  private getFallbackResponse(keywords: string[]): string {
    const keywordResponses: Record<string, string> = {
      'support': 'Thank you for reaching out to our support team. We have received your inquiry and will get back to you within 24 hours.',
      'help': 'We\'re here to help! Your request has been received and our team will respond shortly.',
      'urgent': 'We understand this is urgent and will prioritize your request. A team member will contact you as soon as possible.',
      'question': 'Thank you for your question. We\'re reviewing it and will provide a detailed response shortly.',
      'issue': 'We\'re sorry to hear you\'re experiencing an issue. Our team is looking into this and will contact you shortly.',
    };

    const primaryKeyword = keywords[0] || 'general';
    return keywordResponses[primaryKeyword.toLowerCase()] || 
           'Thank you for your email. We have received your message and will respond as soon as possible.';
  }
}

export const aiResponder = new AIResponder();
