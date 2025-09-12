# Email Responder Application

A comprehensive email automation system that monitors incoming emails, detects engine-related queries using AI, and automatically generates personalized responses.

## Features

- **Email Monitoring**: Monitors IMAP/SMTP email accounts for new messages
- **AI-Powered Detection**: Uses OpenAI to identify engine-related queries
- **Automated Responses**: Generates and sends personalized email responses
- **Case Management**: Tracks and manages customer inquiries as cases
- **Microsoft 365 Integration**: Full integration with Outlook and OneDrive
- **Keyword Detection**: Configurable keyword-based email filtering
- **Dashboard**: Real-time monitoring and analytics dashboard

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Database**: In-memory storage (configurable for production)
- **AI**: OpenAI GPT models
- **Email**: IMAP/SMTP, Microsoft Graph API
- **Deployment**: Vercel (serverless functions)

## Quick Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```bash
# Microsoft Azure AD Configuration
MICROSOFT_CLIENT_ID=your_azure_client_id
MICROSOFT_CLIENT_SECRET=your_azure_client_secret
MICROSOFT_TENANT_ID=your_azure_tenant_id

# Database Configuration
DATABASE_URL=your_database_url (optional - defaults to in-memory)

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Session Configuration
SESSION_SECRET=your_random_session_secret

# Environment
NODE_ENV=production
PORT=5000
```

### 3. Getting Microsoft Azure Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Set the following:
   - **Name**: Email Responder App
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web → `https://your-domain.com/integration/auth/callback`
5. After creation, note down:
   - **Application (client) ID** → `MICROSOFT_CLIENT_ID`
   - **Directory (tenant) ID** → `MICROSOFT_TENANT_ID`
6. Go to **Certificates & secrets** > **New client secret**
7. Copy the secret value → `MICROSOFT_CLIENT_SECRET`
8. Go to **API permissions** > **Add a permission** > **Microsoft Graph**
9. Add these **delegated permissions**:
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `User.Read`
   - `Files.ReadWrite.All`

### 4. Getting OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API Keys** > **Create new secret key**
3. Copy the key → `OPENAI_API_KEY`

### 5. Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 6. Deployment

#### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Set environment variables in Vercel Dashboard:
   - Go to your project settings
   - Navigate to **Environment Variables**
   - Add all variables from step 2

#### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder and server files to your hosting provider

## Configuration

### Email Account Setup

1. Access the web interface at `http://localhost:3005` (development) or your deployed URL
2. Navigate to **Settings**
3. Configure your email account:
   - **Email Address**: Your monitoring email
   - **IMAP Server**: Usually `outlook.office365.com` for Microsoft 365
   - **IMAP Port**: 993 (TLS)
   - **Password**: Your email password or app password

### Keyword Configuration

1. Go to **Keywords** section
2. Add relevant keywords for engine-related queries
3. Examples: "engine", "motor", "repair", "service", "maintenance", "oil", "parts"

### AI Response Configuration

1. Configure your OpenAI API key in environment variables
2. Set up response templates in the **Settings** section
3. Customize the AI personality and response style

## Usage

### Starting the System

1. Configure your email account in the web interface
2. Add relevant keywords
3. Click **Start System** in the dashboard
4. The system will begin monitoring emails automatically

### Monitoring

- **Dashboard**: View real-time statistics and case status
- **Cases**: Browse and manage all customer inquiries
- **Analytics**: Track response rates and system performance

### Manual Actions

- **Pause/Resume**: Temporarily stop/start email monitoring
- **Case Updates**: Manually update case status or add notes
- **Response Review**: Review and edit AI-generated responses before sending

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Microsoft Azure credentials are correct
   - Ensure API permissions are granted
   - Check redirect URI matches your domain

2. **Email Connection Issues**
   - Verify IMAP settings with your email provider
   - Check if app-specific passwords are required
   - Ensure firewall allows IMAP connections

3. **AI Response Issues**
   - Verify OpenAI API key has sufficient credits
   - Check API key permissions
   - Review response templates for errors

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development npm run dev
```

## Security Considerations

- **Never commit `.env` files** to version control
- Use **app-specific passwords** for email accounts
- Enable **two-factor authentication** on all accounts
- Regularly rotate API keys and secrets
- Monitor API usage and set up alerts

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs in your deployment platform
3. Ensure all environment variables are correctly set
4. Verify API permissions and credentials

## License

This project is private and confidential. Please contact the development team for access and support.