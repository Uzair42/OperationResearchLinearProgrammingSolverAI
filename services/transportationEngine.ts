
import { TransportationInput, TransportationResult, TransportationAllocation } from "../types";

export class TransportationEngine {

    // Helper to clone and balance
    private static prepare(input: TransportationInput): { 
        supplies: number[], 
        demands: number[], 
        costs: number[][], 
        steps: string[],
        isBalanced: boolean 
    } {
        const supplies = input.sources.map(s => s.supply);
        const demands = input.destinations.map(d => d.demand);
        const costs = input.costs.map(row => [...row]);
        const steps: string[] = [];

        const totalSupply = supplies.reduce((a, b) => a + b, 0);
        const totalDemand = demands.reduce((a, b) => a + b, 0);
        let isBalanced = true;

        if (totalSupply > totalDemand) {
            isBalanced = false;
            const diff = totalSupply - totalDemand;
            steps.push(`Unbalanced: Total Supply (${totalSupply}) > Total Demand (${totalDemand}). Added Dummy Destination with demand ${diff}.`);
            demands.push(diff);
            costs.forEach(row => row.push(0)); // 0 cost to dummy
        } else if (totalDemand > totalSupply) {
            isBalanced = false;
            const diff = totalDemand - totalSupply;
            steps.push(`Unbalanced: Total Demand (${totalDemand}) > Total Supply (${totalSupply}). Added Dummy Source with supply ${diff}.`);
            supplies.push(diff);
            costs.push(new Array(demands.length).fill(0));
        } else {
            steps.push(`Balanced: Total Supply = Total Demand = ${totalSupply}`);
        }

        return { supplies, demands, costs, steps, isBalanced };
    }

    public static solveNWCR(input: TransportationInput): TransportationResult {
        const { supplies, demands, costs, steps, isBalanced } = this.prepare(input);
        const allocations: TransportationAllocation[] = [];
        let totalCost = 0;

        let i = 0; // source index
        let j = 0; // dest index

        steps.push("Starting North West Corner Rule...");

        while (i < supplies.length && j < demands.length) {
            const quantity = Math.min(supplies[i], demands[j]);
            
            if (quantity > 0) {
                allocations.push({
                    sourceIndex: i,
                    destIndex: j,
                    quantity: quantity,
                    costPerUnit: costs[i][j]
                });
                totalCost += quantity * costs[i][j];
                steps.push(`Allocated ${quantity} units from S${i+1} to D${j+1}`);
            }

            supplies[i] -= quantity;
            demands[j] -= quantity;

            if (supplies[i] === 0) i++;
            if (demands[j] === 0) j++;
        }

        return { method: 'NWCR', allocations, totalCost, steps, isBalanced };
    }

    public static solveLCM(input: TransportationInput): TransportationResult {
        const { supplies, demands, costs, steps, isBalanced } = this.prepare(input);
        const allocations: TransportationAllocation[] = [];
        let totalCost = 0;
        
        // Track available cells
        // We use a large number to 'cross out' cells
        const tempCosts = costs.map(row => [...row]);

        steps.push("Starting Least Cost Method...");

        let iterations = 0;
        while (Math.max(...supplies) > 0 && Math.max(...demands) > 0 && iterations < 1000) {
            iterations++;
            // Find min cost cell
            let minVal = Infinity;
            let minI = -1;
            let minJ = -1;

            for(let i=0; i<supplies.length; i++) {
                if (supplies[i] <= 0) continue;
                for(let j=0; j<demands.length; j++) {
                    if (demands[j] <= 0) continue;
                    if (tempCosts[i][j] < minVal) {
                        minVal = tempCosts[i][j];
                        minI = i;
                        minJ = j;
                    }
                }
            }

            if (minI === -1) break;

            const quantity = Math.min(supplies[minI], demands[minJ]);
            allocations.push({
                sourceIndex: minI,
                destIndex: minJ,
                quantity,
                costPerUnit: costs[minI][minJ] // Use original cost
            });
            totalCost += quantity * costs[minI][minJ];
            steps.push(`Found lowest cost ${costs[minI][minJ]} at (S${minI+1}, D${minJ+1}). Allocated ${quantity}.`);

            supplies[minI] -= quantity;
            demands[minJ] -= quantity;

            // Mark exhausted row/col as visited by making cost Infinity
            if (supplies[minI] === 0) {
                // Row exhausted
                // Ideally we just check supply array in loop, but technically we conceptually cross it out
            }
            if (demands[minJ] === 0) {
                // Col exhausted
            }
        }

        return { method: 'LCM', allocations, totalCost, steps, isBalanced };
    }

    public static solveVAM(input: TransportationInput): TransportationResult {
        const { supplies, demands, costs, steps, isBalanced } = this.prepare(input);
        const allocations: TransportationAllocation[] = [];
        let totalCost = 0;
        
        // Track validity of rows/cols
        const rowDone = new Array(supplies.length).fill(false);
        const colDone = new Array(demands.length).fill(false);
        let remainingRows = supplies.length;
        let remainingCols = demands.length;

        steps.push("Starting Vogel's Approximation Method (VAM)...");

        while (remainingRows > 0 && remainingCols > 0) {
            // Calculate Row Penalties
            let maxPenalty = -1;
            let selection = { type: 'none', index: -1 }; // type: row or col

            // Rows
            for (let i = 0; i < supplies.length; i++) {
                if (rowDone[i]) continue;
                const validCosts = [];
                for (let j = 0; j < demands.length; j++) {
                    if (!colDone[j]) validCosts.push(costs[i][j]);
                }
                
                if (validCosts.length === 0) continue;
                validCosts.sort((a, b) => a - b);
                const penalty = validCosts.length > 1 ? validCosts[1] - validCosts[0] : validCosts[0];
                
                if (penalty > maxPenalty) {
                    maxPenalty = penalty;
                    selection = { type: 'row', index: i };
                }
            }

            // Cols
            for (let j = 0; j < demands.length; j++) {
                if (colDone[j]) continue;
                const validCosts = [];
                for (let i = 0; i < supplies.length; i++) {
                    if (!rowDone[i]) validCosts.push(costs[i][j]);
                }

                if (validCosts.length === 0) continue;
                validCosts.sort((a, b) => a - b);
                const penalty = validCosts.length > 1 ? validCosts[1] - validCosts[0] : validCosts[0];

                if (penalty > maxPenalty) { // Prefer row if tie? Or strictly greater. Using strict > favors rows checked first if tie.
                    maxPenalty = penalty;
                    selection = { type: 'col', index: j };
                }
            }

            // Perform Allocation
            let allocI = -1;
            let allocJ = -1;

            if (selection.type === 'row') {
                const i = selection.index;
                // Find min cost in this row
                let minCost = Infinity;
                let minJ = -1;
                for (let j = 0; j < demands.length; j++) {
                    if (!colDone[j] && costs[i][j] < minCost) {
                        minCost = costs[i][j];
                        minJ = j;
                    }
                }
                allocI = i;
                allocJ = minJ;
                steps.push(`Max Penalty ${maxPenalty} in Row S${i+1}. Selected cell (S${i+1}, D${minJ+1}) with cost ${minCost}.`);
            } else if (selection.type === 'col') {
                const j = selection.index;
                // Find min cost in this col
                let minCost = Infinity;
                let minI = -1;
                for (let i = 0; i < supplies.length; i++) {
                    if (!rowDone[i] && costs[i][j] < minCost) {
                        minCost = costs[i][j];
                        minI = i;
                    }
                }
                allocI = minI;
                allocJ = j;
                steps.push(`Max Penalty ${maxPenalty} in Col D${j+1}. Selected cell (S${minI+1}, D${j+1}) with cost ${minCost}.`);
            }

            if (allocI === -1 || allocJ === -1) break;

            const quantity = Math.min(supplies[allocI], demands[allocJ]);
            allocations.push({
                sourceIndex: allocI,
                destIndex: allocJ,
                quantity,
                costPerUnit: costs[allocI][allocJ]
            });
            totalCost += quantity * costs[allocI][allocJ];

            supplies[allocI] -= quantity;
            demands[allocJ] -= quantity;

            if (supplies[allocI] === 0) {
                rowDone[allocI] = true;
                remainingRows--;
            }
            if (demands[allocJ] === 0) {
                colDone[allocJ] = true;
                remainingCols--;
            }
        }

        return { method: 'VAM', allocations, totalCost, steps, isBalanced };
    }
}
