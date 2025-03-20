import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OptimizationResultData } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

interface ResultsDisplayProps {
  result: OptimizationResultData;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const { patterns, summary } = result;
  
  // Format functions
  const formatLength = (mm: number) => `${mm.toLocaleString()} mm`;
  const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`;
  
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Optimization Results</h3>
      
      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
        <p className="text-sm text-green-800 font-medium">
          Optimization complete! Efficiency: {formatPercentage(summary.efficiency)}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pattern</TableHead>
              <TableHead>Cutting Layout</TableHead>
              <TableHead>Waste</TableHead>
              <TableHead>Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patterns.map((pattern, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{pattern.pattern}</TableCell>
                <TableCell>
                  <div className="flex items-center h-4">
                    {pattern.cuttingLayout.map((piece, i) => {
                      // Calculate relative width based on length
                      const standardLength = 3000; // Assuming standard bar length
                      const width = Math.max((piece.length / standardLength) * 100, 5);
                      
                      // Determine color based on piece type
                      let bgColor = 'bg-primary';
                      if (piece.type === 'waste') {
                        bgColor = 'bg-neutral-300';
                      } else if (i % 2 === 1) {
                        bgColor = 'bg-secondary';
                      }
                      
                      // First piece gets rounded left, last piece gets rounded right
                      const isFirst = i === 0;
                      const isLast = i === pattern.cuttingLayout.length - 1;
                      const rounded = `${isFirst ? 'rounded-l-sm' : ''} ${isLast ? 'rounded-r-sm' : ''}`;
                      
                      return (
                        <div 
                          key={i}
                          className={`h-full ${bgColor} ${rounded}`}
                          style={{ width: `${width}%` }}
                          title={`${piece.length}mm ${piece.type === 'waste' ? '(waste)' : ''}`}
                        />
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  {formatLength(pattern.waste.amount)} ({formatPercentage(pattern.waste.percentage)})
                </TableCell>
                <TableCell>{pattern.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-6 bg-neutral-100 p-4 rounded-md">
        <h4 className="font-medium mb-2">Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-sm text-neutral-500">Total Material Used</p>
              <p className="text-lg font-bold">{formatLength(summary.totalMaterial)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-sm text-neutral-500">Total Waste</p>
              <p className="text-lg font-bold">{formatLength(summary.totalWaste)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-sm text-neutral-500">Efficiency</p>
              <p className="text-lg font-bold text-green-600">{formatPercentage(summary.efficiency)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
