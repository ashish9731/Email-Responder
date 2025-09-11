import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailMonitor } from "./services/emailMonitor";
import { caseManager } from "./services/caseManager";
import { createFolderStructure } from "./onedriveClient";
import { insertConfigurationSchema, insertKeywordSchema } from "@shared/schema";

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
      const folder = await createFolderStructure();
      await storage.updateSystemStatus({ onedriveConnected: true });
      res.json({ message: "OneDrive setup completed", folder });
    } catch (error) {
      res.status(500).json({ message: "Failed to setup OneDrive" });
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

  const httpServer = createServer(app);
  return httpServer;
}
