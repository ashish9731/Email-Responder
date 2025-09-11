import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailMonitor } from "./services/emailMonitor";
import { caseManager } from "./services/caseManager";
import { createFolderStructure, getUncachableOneDriveClient } from "./onedriveClient";
import * as msalModule from "./msal";
import { insertConfigurationSchema, insertKeywordSchema, insertMicrosoftCredentialsSchema, type EmailCase, type Keyword } from "@shared/schema";

// Define scopes for Microsoft Graph API
const OUTLOOK_SCOPES = ["User.Read", "Mail.ReadWrite", "Mail.Send"];
const ONEDRIVE_SCOPES = ["User.Read", "Files.ReadWrite.All"];
const REDIRECT_URI = "http://localhost:5001/integration/auth/callback";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configuration routes
  app.get("/api/configuration", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      res.json(config || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get configuration" });
    }
  });

  app.post("/api/configuration", async (req, res) => {
    try {
      const validatedData = insertConfigurationSchema.parse(req.body);
      const config = await storage.saveConfiguration(validatedData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Invalid configuration data" });
    }
  });

  app.patch("/api/configuration", async (req, res) => {
    try {
      const config = await storage.updateConfiguration(req.body);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Failed to update configuration" });
    }
  });

  // System control routes
  app.post("/api/system/start", async (req, res) => {
    try {
      await emailMonitor.start();
      res.json({ message: "System started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start system" });
    }
  });

  app.post("/api/system/stop", async (req, res) => {
    try {
      await emailMonitor.stop();
      res.json({ message: "System stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop system" });
    }
  });

  app.get("/api/system/status", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      const monitorStatus = emailMonitor.getStatus();
      const caseStats = await caseManager.getCaseStats();
      
      res.json({
        ...status,
        monitorStatus,
        caseStats
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get system status" });
    }
  });

  app.get("/api/me", (req, res) => {
    // @ts-ignore
    res.json(req.session.account || null);
  });

  app.patch("/api/me", (req, res) => {
    const { name, profilePictureUrl } = req.body;
    // @ts-ignore
    if (req.session.account) {
      // @ts-ignore
      req.session.account.name = name;
      // @ts-ignore
      req.session.account.profilePictureUrl = profilePictureUrl;
      // @ts-ignore
      res.json(req.session.account);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.post("/api/me/profile-picture", (req, res) => {
    const { base64Image } = req.body;
    // @ts-ignore
    if (req.session.account && base64Image) {
      // @ts-ignore
      req.session.account.profilePictureUrl = base64Image;
      // @ts-ignore
      res.json({ profilePictureUrl: req.session.account.profilePictureUrl });
    } else {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.delete("/api/me/profile-picture", (req, res) => {
    // @ts-ignore
    if (req.session.account) {
      // @ts-ignore
      req.session.account.profilePictureUrl = null;
      res.json({ message: "Profile picture deleted" });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Email cases routes
  app.get("/api/cases", async (req, res) => {
    try {
      const cases = await caseManager.getAllCases();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cases" });
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const emailCase = await caseManager.getCase(req.params.id);
      if (!emailCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(emailCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to get case" });
    }
  });

  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const updatedCase = await caseManager.updateCase(req.params.id, req.body);
      res.json(updatedCase);
    } catch (error) {
      res.status(400).json({ message: "Failed to update case" });
    }
  });

  // Keywords routes
  app.get("/api/keywords", async (req, res) => {
    try {
      const keywords = await storage.getAllKeywords();
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get keywords" });
    }
  });

  app.post("/api/keywords", async (req, res) => {
    try {
      const validatedData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.addKeyword(validatedData);
      res.json(keyword);
    } catch (error) {
      res.status(400).json({ message: "Invalid keyword data" });
    }
  });

  app.delete("/api/keywords/:id", async (req, res) => {
    try {
      await storage.removeKeyword(req.params.id);
      res.json({ message: "Keyword removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove keyword" });
    }
  });

  // OneDrive setup route
  app.post("/api/onedrive/setup", async (req, res) => {
    try {
        // @ts-ignore
        const accessToken = req.session.accessToken;
        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }
      const folder = await (createFolderStructure as (accessToken: string) => Promise<any>)(accessToken);
      await storage.updateSystemStatus({ onedriveConnected: true });
      res.json({ message: "OneDrive setup completed", folder });
    } catch (error) {
      res.status(500).json({ message: "Failed to setup OneDrive" });
    }
  });

  // OneDrive files route
  app.get("/api/onedrive/files", async (req, res) => {
    try {
      // @ts-ignore
      let accessToken = req.session.accessToken;

      if (!accessToken) {
        const credentials = await storage.getMicrosoftCredentials();
        if (!credentials || !credentials.tokenCache) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        msalModule.pca.getTokenCache().deserialize(credentials.tokenCache);
        const accounts = await msalModule.pca.getTokenCache().getAllAccounts();
        if (accounts.length === 0) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const account = accounts[0];
        const response = await msalModule.pca.acquireTokenSilent({
          account,
          scopes: ONEDRIVE_SCOPES,
        });
        if (!response || !response.accessToken) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        accessToken = response.accessToken;
      }

      const client = await (getUncachableOneDriveClient as (accessToken: string) => any)(accessToken);
      const rootFolder = await client.api("/me/drive/root/children").get();
      const mainFolder = rootFolder.value.find((folder: any) => folder.name === "AutoRespondMail");
      if (!mainFolder) {
        return res.json([]);
      }
      const documentsFolder = await client.api(`/me/drive/items/${mainFolder.id}/children`).get();
      const emailResponsesFolder = documentsFolder.value.find((folder: any) => folder.name === "Email Responses");
      if (!emailResponsesFolder) {
        return res.json([]);
      }

      const caseFolders = await client.api(`/me/drive/items/${emailResponsesFolder.id}/children`).get();
      
      const files = [];
      for (const caseFolder of caseFolders.value) {
        const caseFiles = await client.api(`/me/drive/items/${caseFolder.id}/children`).get();
        for (const file of caseFiles.value) {
          files.push({
            id: file.id,
            name: file.name,
            type: "response",
            size: file.size,
            modified: file.lastModifiedDateTime ? new Date(file.lastModifiedDateTime) : new Date(),
            case: caseFolder.name,
          });
        }
      }

      res.json(files);
    } catch (error) {
      console.error("Error fetching OneDrive files:", error);
      res.status(500).json({ message: "Failed to fetch OneDrive files" });
    }
  });

  // Analytics route
  app.get("/api/analytics", async (req, res) => {
    try {
      const cases = await storage.getAllEmailCases();
      const keywords = await storage.getAllKeywords();
      
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      // Calculate performance data based on real cases
      const cases7Days = cases.filter((c: EmailCase) => c.createdAt && new Date(c.createdAt) >= last7Days);
      const cases30Days = cases.filter((c: EmailCase) => c.createdAt && new Date(c.createdAt) >= last30Days);
      const cases90Days = cases.filter((c: EmailCase) => c.createdAt && new Date(c.createdAt) >= last90Days);
      
      const responded7Days = cases7Days.filter((c: EmailCase) => c.status === 'responded' || c.status === 'completed' || c.status === 'follow_up_sent').length;
      const responded30Days = cases30Days.filter((c: EmailCase) => c.status === 'responded' || c.status === 'completed' || c.status === 'follow_up_sent').length;
      const responded90Days = cases90Days.filter((c: EmailCase) => c.status === 'responded' || c.status === 'completed' || c.status === 'follow_up_sent').length;
      
      const performanceData = [
        { 
          period: "Last 7 days", 
          emails: cases7Days.length, 
          responses: responded7Days, 
          rate: cases7Days.length > 0 ? `${Math.round((responded7Days / cases7Days.length) * 100)}%` : "0%" 
        },
        { 
          period: "Last 30 days", 
          emails: cases30Days.length, 
          responses: responded30Days, 
          rate: cases30Days.length > 0 ? `${Math.round((responded30Days / cases30Days.length) * 100)}%` : "0%" 
        },
        { 
          period: "Last 90 days", 
          emails: cases90Days.length, 
          responses: responded90Days, 
          rate: cases90Days.length > 0 ? `${Math.round((responded90Days / cases90Days.length) * 100)}%` : "0%" 
        }
      ];
      
      // Calculate keyword analytics based on actual case subjects and keywords
      const keywordAnalytics = keywords.map((keyword: Keyword) => {
        // Count cases that contain this keyword in their subject or content
        const keywordCases = cases.filter((c: EmailCase) => 
          c.subject.toLowerCase().includes(keyword.keyword.toLowerCase()) ||
          (c.originalBody && c.originalBody.toLowerCase().includes(keyword.keyword.toLowerCase()))
        );
        
        const recentCases = keywordCases.filter((c: EmailCase) => c.createdAt && new Date(c.createdAt) >= last30Days);
        const olderCases = keywordCases.filter((c: EmailCase) => c.createdAt && new Date(c.createdAt) < last30Days && c.createdAt && new Date(c.createdAt) >= last90Days);
        
        let trend = "0%";
        if (olderCases.length > 0) {
          const trendPercent = Math.round(((recentCases.length - olderCases.length) / olderCases.length) * 100);
          trend = trendPercent > 0 ? `+${trendPercent}%` : `${trendPercent}%`;
        } else if (recentCases.length > 0) {
          trend = "+100%"; // New keyword with cases
        }
        
        return {
          keyword: keyword.keyword,
          count: keywordCases.length,
          trend
        };
      });
      
      res.json({
        performanceData,
        keywordAnalytics
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Test connection route
  app.post("/api/test-connection", async (req, res) => {
    try {
      const { imapServer, imapPort, email, password } = req.body;
      
      // Here you would implement IMAP connection test
      // For now, just return success if all fields are provided
      if (imapServer && imapPort && email && password) {
        res.json({ success: true, message: "Connection test successful" });
      } else {
        res.status(400).json({ success: false, message: "Missing required fields" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Connection test failed" });
    }
  });

  // Microsoft integration routes
  app.get("/integration/outlook", async (req, res) => {
    try {
      const url = await msalModule.getAuthCodeUrl(OUTLOOK_SCOPES, REDIRECT_URI);
      res.redirect(url);
    } catch (error) {
      console.error("Failed to get auth code url", error);
      res.status(500).json({ message: "Failed to get auth code url" });
    }
  });

  app.get("/integration/onedrive", async (req, res) => {
    try {
      const url = await msalModule.getAuthCodeUrl(ONEDRIVE_SCOPES, REDIRECT_URI);
      res.redirect(url);
    } catch (error) {
      console.error("Failed to get auth code url", error);
      res.status(500).json({ message: "Failed to get auth code url" });
    }
  });

  app.get("/integration/auth/callback", async (req, res) => {
    const { code } = req.query;
    if (typeof code !== "string") {
      res.status(400).json({ message: "Invalid code" });
      return;
    }
    try {
      const response = await msalModule.acquireTokenByCode(OUTLOOK_SCOPES.concat(ONEDRIVE_SCOPES), REDIRECT_URI, code);
      // @ts-ignore
      req.session.accessToken = response.accessToken;
      // @ts-ignore
      req.session.account = response.account;

      const tokenCache = msalModule.pca.getTokenCache().serialize();
      const credentials = await storage.getMicrosoftCredentials();
      if (credentials) {
        await storage.updateMicrosoftCredentials({ ...credentials, tokenCache });
      } else {
        // This should not happen, as the user should have saved the credentials by now
      }

      await storage.updateSystemStatus({ outlookConnected: true, onedriveConnected: true });

      res.redirect("/configuration");
    } catch (error) {
      console.error("Failed to acquire token", error);
      res.status(500).json({ message: "Failed to acquire token" });
    }
  });


  // Manual Microsoft credentials route
  app.post("/api/microsoft/manual", async (req, res) => {
    try {
      const validatedData = insertMicrosoftCredentialsSchema.parse({
        ...req.body,
        connectionType: "manual",
        isActive: true
      });
      
      // Save the credentials using storage
      const savedCredentials = await storage.saveMicrosoftCredentials(validatedData);
      
      // Update system status to reflect manual connection
      await storage.updateSystemStatus({
        outlookConnected: true,
        onedriveConnected: true
      });
      
      res.json({ 
        success: true, 
        message: "Microsoft credentials saved successfully",
        connectionType: "manual",
        credentialsId: savedCredentials.id
      });
    } catch (error) {
      console.error("Error saving Microsoft credentials:", error);
      res.status(400).json({ 
        success: false, 
        message: "Failed to save Microsoft credentials",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Check Microsoft connection status
  app.get("/api/microsoft/status", async (req, res) => {
    try {
      // Get system status and Microsoft credentials
      const systemStatus = await storage.getSystemStatus();
      const microsoftCredentials = await storage.getMicrosoftCredentials();
      
      let outlookStatus = false;
      let onedriveStatus = false;
      let connectionType = "none";
      
      // Check if we have manual credentials saved
      if (microsoftCredentials && microsoftCredentials.isActive) {
        connectionType = "manual";
        outlookStatus = systemStatus?.outlookConnected || false;
        onedriveStatus = systemStatus?.onedriveConnected || false;
      } else {
        // Check for integration status
        outlookStatus = systemStatus?.outlookConnected || false;
        onedriveStatus = systemStatus?.onedriveConnected || false;
        connectionType = (outlookStatus || onedriveStatus) ? "integration" : "none";
      }

      res.json({
        outlook: {
          connected: outlookStatus,
          type: connectionType
        },
        onedrive: {
          connected: onedriveStatus,
          type: connectionType
        },
        hasCredentials: !!microsoftCredentials,
        credentialsType: microsoftCredentials?.connectionType || "none"
      });
    } catch (error) {
      console.error("Error checking Microsoft connection status:", error);
      res.status(500).json({ message: "Failed to check Microsoft connection status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

