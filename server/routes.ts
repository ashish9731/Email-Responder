import express from 'express';
import { storage } from './storage';
import { emailMonitor } from './services/emailMonitor';

const router = express.Router();

// System status endpoint
router.get('/system/status', async (req, res) => {
  try {
    const status = await storage.getSystemStatus();
    const credentials = await storage.getMicrosoftCredentials();
    
    res.json({
      status: status || {
        emailMonitorActive: false,
        outlookConnected: false,
        onedriveConnected: false,
        lastUpdated: new Date()
      },
      hasCredentials: !!credentials,
      isConnected: !!(credentials?.tokenCache && status?.outlookConnected)
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Keywords endpoints
router.get('/keywords', async (req, res) => {
  try {
    const keywords = await storage.getAllKeywords();
    res.json(keywords);
  } catch (error) {
    console.error('Error getting keywords:', error);
    res.status(500).json({ error: 'Failed to get keywords' });
  }
});

router.post('/keywords', async (req, res) => {
  try {
    const { keyword, isActive = true } = req.body;
    
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    const newKeyword = await storage.addKeyword({ keyword, isActive });
    res.json(newKeyword);
  } catch (error) {
    console.error('Error adding keyword:', error);
    res.status(500).json({ error: 'Failed to add keyword' });
  }
});

router.delete('/keywords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await storage.removeKeyword(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing keyword:', error);
    res.status(500).json({ error: 'Failed to remove keyword' });
  }
});

// Microsoft 365 setup endpoints
router.post('/microsoft/setup', async (req, res) => {
  try {
    const { clientId, clientSecret, tenantId } = req.body;
    
    if (!clientId || !clientSecret || !tenantId) {
      return res.status(400).json({ error: 'Client ID, client secret, and tenant ID are required' });
    }
    
    const credentials = await storage.saveMicrosoftCredentials({
      clientId,
      clientSecret,
      tenantId,
      connectionType: 'oauth'
    });
    
    res.json({ success: true, credentials });
  } catch (error) {
    console.error('Error saving Microsoft credentials:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

router.post('/microsoft/auth', async (req, res) => {
  try {
    const credentials = await storage.getMicrosoftCredentials();
    if (!credentials) {
      return res.status(400).json({ error: 'No Microsoft credentials found' });
    }

    const authUrl = `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/authorize?client_id=${credentials.clientId}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback')}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}&response_mode=query`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

router.post('/microsoft/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    const credentials = await storage.getMicrosoftCredentials();
    if (!credentials) {
      return res.status(400).json({ error: 'No Microsoft credentials found' });
    }

    // Store the token cache (simplified - in real app, exchange code for token)
    await storage.updateMicrosoftCredentials({
      tokenCache: code, // Using code as token cache for simplicity
      isActive: true
    });
    
    await storage.updateSystemStatus({
      outlookConnected: true,
      onedriveConnected: true,
      lastUpdated: new Date()
    });
    
    // Start email monitor
    emailMonitor.start();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling auth callback:', error);
    res.status(500).json({ error: 'Failed to complete authentication' });
  }
});

// Email cases endpoints
router.get('/email-cases', async (req, res) => {
  try {
    const cases = await storage.getAllEmailCases();
    res.json(cases);
  } catch (error) {
    console.error('Error getting email cases:', error);
    res.status(500).json({ error: 'Failed to get email cases' });
  }
});

router.get('/email-cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const emailCase = await storage.getEmailCase(id);
    
    if (!emailCase) {
      return res.status(404).json({ error: 'Email case not found' });
    }
    
    res.json(emailCase);
  } catch (error) {
    console.error('Error getting email case:', error);
    res.status(500).json({ error: 'Failed to get email case' });
  }
});

// Email monitor control
router.post('/email-monitor/start', async (req, res) => {
  try {
    await emailMonitor.start();
    res.json({ success: true });
  } catch (error) {
    console.error('Error starting email monitor:', error);
    res.status(500).json({ error: 'Failed to start email monitor' });
  }
});

router.post('/email-monitor/stop', async (req, res) => {
  try {
    await emailMonitor.stop();
    res.json({ success: true });
  } catch (error) {
    console.error('Error stopping email monitor:', error);
    res.status(500).json({ error: 'Failed to stop email monitor' });
  }
});

export default router;

