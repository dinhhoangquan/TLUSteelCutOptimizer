import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SteelItemsSchema, OptimizationResultSchema } from "@shared/schema";
import { optimizeSteelCutting } from "./optimization";
import { z } from "zod";
import authRoutes from "./auth";
import { initializeEmailTransport } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize email transport for auth emails
  await initializeEmailTransport();

  // Register auth routes
  app.use('/api/auth', authRoutes);

  // API routes for steel cutting optimization
  app.post("/api/optimize", async (req, res) => {
    try {
      const itemsResult = SteelItemsSchema.safeParse(req.body);
      
      if (!itemsResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: itemsResult.error.errors 
        });
      }
      
      const optimizationResult = await optimizeSteelCutting(itemsResult.data);
      
      // Save the optimization result if a user is logged in
      if (req.session && req.session.userId) {
        const userId = req.session.userId;
        
        try {
          // Store the optimization result
          await storage.createOptimizationResult({
            userId,
            patterns: optimizationResult.patterns,
            totalMaterial: optimizationResult.summary.totalMaterial,
            totalWaste: optimizationResult.summary.totalWaste,
            efficiency: optimizationResult.summary.efficiency.toString(),
            createdAt: new Date().toISOString()
          });
        } catch (storageError) {
          console.error("Failed to save optimization result:", storageError);
          // Continue even if storage fails
        }
      }
      
      return res.status(200).json(optimizationResult);
    } catch (error) {
      console.error("Optimization error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred during optimization" 
      });
    }
  });

  // API route to get user's steel items
  app.get("/api/steel-items", async (req, res) => {
    try {
      // Get steel items for the current user if logged in, or get public items
      const userId = req.session?.userId;
      const items = await storage.getSteelItems(userId);
      return res.status(200).json(items);
    } catch (error) {
      console.error("Error fetching steel items:", error);
      return res.status(500).json({ 
        message: "Error fetching steel items" 
      });
    }
  });

  // API route to create a steel item
  app.post("/api/steel-items", async (req, res) => {
    try {
      const result = SteelItemSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: result.error.errors 
        });
      }
      
      // Associate item with user if logged in
      const userId = req.session?.userId;
      
      const item = await storage.createSteelItem({
        ...result.data,
        userId: userId || null
      });
      
      return res.status(201).json(item);
    } catch (error) {
      console.error("Error creating steel item:", error);
      return res.status(500).json({ 
        message: "Error creating steel item" 
      });
    }
  });

  // API route to update a steel item
  app.put("/api/steel-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const result = SteelItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: result.error.errors 
        });
      }
      
      // Check if item exists and belongs to the user
      const existingItem = await storage.getSteelItems();
      const item = existingItem.find(item => item.id === id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Only allow update if item is public or belongs to the user
      const userId = req.session?.userId;
      if (item.userId && item.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this item" });
      }
      
      const updatedItem = await storage.updateSteelItem(id, result.data);
      return res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Error updating steel item:", error);
      return res.status(500).json({ 
        message: "Error updating steel item" 
      });
    }
  });

  // API route to delete a steel item
  app.delete("/api/steel-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Check if item exists and belongs to the user
      const existingItems = await storage.getSteelItems();
      const item = existingItems.find(item => item.id === id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Only allow deletion if item is public or belongs to the user
      const userId = req.session?.userId;
      if (item.userId && item.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this item" });
      }
      
      const success = await storage.deleteSteelItem(id);
      
      if (success) {
        return res.status(200).json({ message: "Item deleted successfully" });
      } else {
        return res.status(500).json({ message: "Failed to delete item" });
      }
    } catch (error) {
      console.error("Error deleting steel item:", error);
      return res.status(500).json({ 
        message: "Error deleting steel item" 
      });
    }
  });

  // API route to get user's optimization history
  app.get("/api/optimization-history", async (req, res) => {
    try {
      // Only return history for logged in users
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const results = await storage.getOptimizationResults(userId);
      return res.status(200).json(results);
    } catch (error) {
      console.error("Error fetching optimization history:", error);
      return res.status(500).json({ 
        message: "Error fetching optimization history" 
      });
    }
  });

  // API route for health check
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "healthy" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
