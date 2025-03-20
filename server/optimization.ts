import { OptimizationPattern, OptimizationResultData, SteelItem } from "@shared/schema";

// Standard length of the steel bar in mm
const STANDARD_BAR_LENGTH = 3000;

interface BarPattern {
  pieces: { length: number; isWaste: boolean }[];
  wasteAmount: number;
  wastePercentage: number;
}

export function optimizeSteelCutting(items: { length: number; quantity: number }[]): OptimizationResultData {
  if (!items.length) {
    throw new Error("No items provided for optimization");
  }

  // Validate input
  items.forEach(item => {
    if (item.length <= 0 || item.quantity <= 0) {
      throw new Error(`Invalid input: Length and quantity must be positive numbers`);
    }
    if (item.length > STANDARD_BAR_LENGTH) {
      throw new Error(`Length ${item.length}mm exceeds standard bar length of ${STANDARD_BAR_LENGTH}mm`);
    }
  });
  
  // Sort items by length in descending order for a better fit
  const sortedItems = [...items].sort((a, b) => b.length - a.length);
  
  // Create a flattened array of all lengths (accounting for quantities)
  const allPieces: number[] = [];
  for (const item of sortedItems) {
    for (let i = 0; i < item.quantity; i++) {
      allPieces.push(item.length);
    }
  }
  
  // Initialize patterns storage
  const patterns: BarPattern[] = [];
  
  // First-fit decreasing algorithm
  let remainingPieces = [...allPieces];
  
  while (remainingPieces.length > 0) {
    // Start a new bar
    const currentPattern: BarPattern = {
      pieces: [],
      wasteAmount: STANDARD_BAR_LENGTH,
      wastePercentage: 100
    };
    
    // Try to fit pieces into the current bar
    let remainingBarLength = STANDARD_BAR_LENGTH;
    
    // Use a copy of remainingPieces to avoid modifying it while iterating
    const updatedRemainingPieces: number[] = [];
    
    for (let i = 0; i < remainingPieces.length; i++) {
      const pieceLength = remainingPieces[i];
      
      if (pieceLength <= remainingBarLength) {
        // Add the piece to the current pattern
        currentPattern.pieces.push({ length: pieceLength, isWaste: false });
        remainingBarLength -= pieceLength;
      } else {
        // This piece doesn't fit, add it to the updated array
        updatedRemainingPieces.push(pieceLength);
      }
    }
    
    // Add waste piece if there's any remaining space
    if (remainingBarLength > 0) {
      currentPattern.pieces.push({ length: remainingBarLength, isWaste: true });
    }
    
    // Update pattern waste information
    currentPattern.wasteAmount = remainingBarLength;
    currentPattern.wastePercentage = (remainingBarLength / STANDARD_BAR_LENGTH) * 100;
    
    // Add the pattern to our list
    patterns.push(currentPattern);
    
    // Update remaining pieces
    remainingPieces = updatedRemainingPieces;
  }
  
  // Consolidate same patterns
  const consolidatedPatterns: Map<string, { pattern: BarPattern; count: number }> = new Map();
  
  for (const pattern of patterns) {
    // Create a signature for the pattern based on the piece lengths
    const signature = pattern.pieces.map(p => `${p.length}${p.isWaste ? 'w' : ''}`).join(',');
    
    if (consolidatedPatterns.has(signature)) {
      consolidatedPatterns.get(signature)!.count++;
    } else {
      consolidatedPatterns.set(signature, { pattern, count: 1 });
    }
  }
  
  // Convert to result format
  const resultPatterns: OptimizationPattern[] = Array.from(consolidatedPatterns.entries()).map(
    ([signature, { pattern, count }], index) => ({
      pattern: `Pattern ${index + 1}`,
      cuttingLayout: pattern.pieces.map(p => ({
        length: p.length,
        type: p.isWaste ? 'waste' : 'piece'
      })),
      waste: {
        amount: pattern.wasteAmount,
        percentage: pattern.wastePercentage
      },
      quantity: count
    })
  );
  
  // Calculate summary statistics
  const totalBars = patterns.length;
  const totalMaterial = totalBars * STANDARD_BAR_LENGTH;
  const totalWaste = patterns.reduce((sum, pattern) => sum + pattern.wasteAmount, 0);
  const efficiency = ((totalMaterial - totalWaste) / totalMaterial) * 100;
  
  return {
    patterns: resultPatterns,
    summary: {
      totalMaterial,
      totalWaste,
      efficiency
    }
  };
}
