import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SteelItemsSchema, OptimizationResultSchema } from "@shared/schema";
import { optimizeSteelCutting } from "./optimization";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      const optimizationResult = optimizeSteelCutting(itemsResult.data);
      
      // Save the optimization result if a user is logged in
      // (in a real app with auth, you'd get the userId from the session)
      // In this simple demo, we'll skip storing the result
      
      return res.status(200).json(optimizationResult);
    } catch (error) {
      console.error("Optimization error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred during optimization" 
      });
    }
  });

  // API route for exporting data (will be handled on the frontend)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "healthy" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
