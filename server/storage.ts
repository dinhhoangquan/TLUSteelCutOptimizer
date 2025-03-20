import { users, type User, type InsertUser, steelItems, type SteelItem, type InsertSteelItem, optimizationResults, type OptimizationResult, type InsertOptimizationResult } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSteelItems(userId?: number): Promise<SteelItem[]>;
  createSteelItem(item: InsertSteelItem): Promise<SteelItem>;
  updateSteelItem(id: number, item: Partial<InsertSteelItem>): Promise<SteelItem | undefined>;
  deleteSteelItem(id: number): Promise<boolean>;
  getOptimizationResults(userId?: number): Promise<OptimizationResult[]>;
  createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private steelItems: Map<number, SteelItem>;
  private optimizationResults: Map<number, OptimizationResult>;
  private userIdCounter: number;
  private steelItemIdCounter: number;
  private optimizationResultIdCounter: number;

  constructor() {
    this.users = new Map();
    this.steelItems = new Map();
    this.optimizationResults = new Map();
    this.userIdCounter = 1;
    this.steelItemIdCounter = 1;
    this.optimizationResultIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSteelItems(userId?: number): Promise<SteelItem[]> {
    if (userId) {
      return Array.from(this.steelItems.values()).filter(
        (item) => item.userId === userId,
      );
    }
    return Array.from(this.steelItems.values());
  }

  async createSteelItem(insertItem: InsertSteelItem): Promise<SteelItem> {
    const id = this.steelItemIdCounter++;
    const item: SteelItem = { ...insertItem, id, userId: insertItem.userId || null };
    this.steelItems.set(id, item);
    return item;
  }

  async updateSteelItem(id: number, updateItem: Partial<InsertSteelItem>): Promise<SteelItem | undefined> {
    const existingItem = this.steelItems.get(id);
    if (!existingItem) {
      return undefined;
    }
    const updatedItem = { ...existingItem, ...updateItem };
    this.steelItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteSteelItem(id: number): Promise<boolean> {
    return this.steelItems.delete(id);
  }

  async getOptimizationResults(userId?: number): Promise<OptimizationResult[]> {
    if (userId) {
      return Array.from(this.optimizationResults.values()).filter(
        (result) => result.userId === userId,
      );
    }
    return Array.from(this.optimizationResults.values());
  }

  async createOptimizationResult(insertResult: InsertOptimizationResult): Promise<OptimizationResult> {
    const id = this.optimizationResultIdCounter++;
    const result: OptimizationResult = { 
      ...insertResult, 
      id,
      userId: insertResult.userId || null
    };
    this.optimizationResults.set(id, result);
    return result;
  }
}

export const storage = new MemStorage();
