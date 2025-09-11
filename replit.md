# Outlook Email Auto-Responder

## Project Overview
A comprehensive 24/7 email auto-responder system that monitors Outlook emails for vessel engine-related issues and automatically generates AI-powered responses with OneDrive checklist attachments.

## Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with Node.js, in-memory storage
- **Email Processing**: IMAP monitoring, SMTP sending, AI response generation
- **File Management**: OneDrive integration for checklist storage and email archiving
- **AI Integration**: OpenAI GPT for intelligent response generation

## Current Status
- ✅ Full-stack application structure implemented
- ✅ Dashboard UI with configuration forms completed
- ✅ Email monitoring service architecture ready
- ✅ AI response generation system built
- ✅ Case management and keyword filtering system
- ⚠️ Microsoft integrations dismissed - need manual credential setup
- ⚠️ OneDrive integration requires manual API credentials
- ⚠️ Outlook/Graph API integration requires manual setup

## User Preferences
- Prefers manual credential management over Replit integrations
- Requires 24/7 automated email monitoring and response
- Needs proper file organization in OneDrive with case-based folders
- Wants engine-related keyword filtering with customizable triggers
- Requires 2-hour follow-up automation

## Required Credentials (to be stored as secrets)
Since Replit integrations were dismissed, these credentials need to be manually configured:

1. **OPENAI_API_KEY**: Already requested from user
2. **MICROSOFT_CLIENT_ID**: Azure App Registration Client ID
3. **MICROSOFT_CLIENT_SECRET**: Azure App Registration Client Secret  
4. **MICROSOFT_TENANT_ID**: Azure Active Directory Tenant ID
5. **MICROSOFT_REDIRECT_URI**: OAuth redirect URI for authentication

## Key Features Implemented
1. **Configuration Dashboard**: IMAP/POP/SMTP server settings
2. **Email Monitoring**: 24/7 IMAP connection with keyword detection
3. **AI Response Generation**: OpenAI-powered email responses and checklists
4. **Case Management**: Automatic case creation with unique IDs (VE-YYYY-XXX format)
5. **File Organization**: OneDrive folder structure for checklists and responses
6. **Follow-up System**: Automated 2-hour follow-up emails
7. **Real-time Dashboard**: System status, statistics, and case monitoring

## Folder Structure Created in OneDrive
```
Email Auto Responder/
├── Checklists/           # Engine inspection checklists
└── Email Responses/      # Saved email responses by case
```

## Engine Keywords (Configurable)
- engine failure
- engine damaged  
- engine fire
- engine broken
- engine rusted
- engine malfunction
- engine issues
- vessel engine

## Next Steps Required
1. Set up Azure App Registration for Microsoft Graph API access
2. Configure OAuth2 flow for OneDrive and Outlook access
3. Request Microsoft API credentials from user
4. Test email monitoring and response system
5. Verify OneDrive file operations
6. Test end-to-end workflow with real emails

## Technical Notes
- Using in-memory storage (MemStorage) as requested
- Email monitoring via node-imap package
- SMTP sending via Microsoft Graph API
- File operations via Microsoft Graph API
- AI responses via OpenAI GPT-4
- Real-time updates every 30 seconds on dashboard