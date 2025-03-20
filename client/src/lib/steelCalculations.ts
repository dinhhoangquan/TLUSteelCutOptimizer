import { OptimizationResultData } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Interface for steel items to optimize
export interface SteelItem {
  length: number;
  quantity: number;
}

// Function to validate input data
export function validateSteelItems(items: SteelItem[]): string | null {
  if (!items.length) {
    return "Please add at least one item";
  }

  for (const item of items) {
    if (!item.length || item.length <= 0) {
      return "Length must be a positive number";
    }
    
    if (!item.quantity || item.quantity <= 0) {
      return "Quantity must be a positive number";
    }
    
    // Maximum length check (assuming standard bar length is 3000mm)
    if (item.length > 3000) {
      return `Length ${item.length}mm exceeds maximum standard length of 3000mm`;
    }
  }
  
  return null;
}

// Function to call the optimization API
export async function optimizeCutting(items: SteelItem[]): Promise<OptimizationResultData> {
  const validationError = validateSteelItems(items);
  if (validationError) {
    throw new Error(validationError);
  }
  
  // Filter out invalid items (this should be redundant given the validation above)
  const validItems = items.filter(item => item.length > 0 && item.quantity > 0);
  
  try {
    const response = await apiRequest('POST', '/api/optimize', validItems);
    const data = await response.json();
    return data as OptimizationResultData;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to optimize steel cutting');
  }
}
