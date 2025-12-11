
import { GameTheoryInput, GameTheoryResult } from "../types";

export class GameTheoryEngine {

    public static solve(input: GameTheoryInput): GameTheoryResult {
        const matrix = input.matrix;
        const numRows = matrix.length;
        const numCols = matrix[0].length;
        const steps: string[] = [];

        // 1. Check for Saddle Point (Pure Strategy)
        // Maximin (Row Minima's Max) vs Minimax (Col Maxima's Min)
        const rowMins = matrix.map(row => Math.min(...row));
        const maxRowMin = Math.max(...rowMins);
        
        const colMaxs = [];
        for(let j=0; j<numCols; j++) {
            let maxVal = -Infinity;
            for(let i=0; i<numRows; i++) if(matrix[i][j] > maxVal) maxVal = matrix[i][j];
            colMaxs.push(maxVal);
        }
        const minColMax = Math.min(...colMaxs);

        if (maxRowMin === minColMax) {
            // Saddle Point Found
            // Find indices
            const saddleVal = maxRowMin;
            let sRow = -1, sCol = -1;
            
            // Find the cell that matches both conditions
            for(let i=0; i<numRows; i++) {
                for(let j=0; j<numCols; j++) {
                    if (matrix[i][j] === saddleVal && rowMins[i] === saddleVal && colMaxs[j] === saddleVal) {
                        sRow = i; sCol = j; break;
                    }
                }
            }

            const optA = new Array(numRows).fill(0); optA[sRow] = 1;
            const optB = new Array(numCols).fill(0); optB[sCol] = 1;

            steps.push(`Maximin (Max of Row Mins) = ${maxRowMin}`);
            steps.push(`Minimax (Min of Col Maxs) = ${minColMax}`);
            steps.push("Saddle Point Exists. Pure Strategy recommended.");

            return {
                hasSaddlePoint: true,
                saddlePoint: { row: sRow, col: sCol, value: saddleVal },
                value: saddleVal,
                optimalStrategiesA: optA,
                optimalStrategiesB: optB,
                reductionSteps: steps,
                methodUsed: 'SADDLE_POINT'
            };
        }

        steps.push("No Saddle Point detected (Maximin ≠ Minimax). Proceeding with Mixed Strategy.");

        // 2. Dominance Principle (Reduction)
        // We work with a dynamic matrix structure keeping track of original indices
        let activeRows = input.playerAStrategies.map((_, i) => i);
        let activeCols = input.playerBStrategies.map((_, i) => i);
        let reduced = false;
        
        // Iterative reduction
        let changed = true;
        while(changed) {
            changed = false;
            
            // Check Row Dominance (Max player prefers Higher values)
            // Row X dominates Row Y if X >= Y for all active cols. Y is deleted.
            const rowsToDelete: number[] = [];
            for (const r1 of activeRows) {
                if (rowsToDelete.includes(r1)) continue;
                for (const r2 of activeRows) {
                    if (r1 === r2 || rowsToDelete.includes(r2)) continue;
                    
                    let r1DominatesR2 = true;
                    // Check all active columns
                    for (const c of activeCols) {
                        if (matrix[r1][c] < matrix[r2][c]) {
                            r1DominatesR2 = false;
                            break;
                        }
                    }
                    
                    if (r1DominatesR2) {
                        rowsToDelete.push(r2);
                        steps.push(`Row ${input.playerAStrategies[r1]} dominates Row ${input.playerAStrategies[r2]}. Eliminating ${input.playerAStrategies[r2]}.`);
                        changed = true;
                    }
                }
            }
            if (rowsToDelete.length > 0) {
                activeRows = activeRows.filter(r => !rowsToDelete.includes(r));
                reduced = true;
                continue; // Restart loop to re-evaluate with reduced matrix
            }

            // Check Col Dominance (Min player prefers Lower values)
            // Col A dominates Col B if A <= B for all active rows. 
            // If A <= B, Player B will NEVER choose B because A is always cheaper/less loss. 
            // So "Dominance" in Game Theory context means the "Better" strategy eliminates the "Worse" one.
            // For B, Lower is Better. So if A <= B, A dominates B. B is eliminated.
            const colsToDelete: number[] = [];
            for (const c1 of activeCols) {
                if (colsToDelete.includes(c1)) continue;
                for (const c2 of activeCols) {
                    if (c1 === c2 || colsToDelete.includes(c2)) continue;

                    let c1DominatesC2 = true; // Does c1 (smaller?) dominate c2 (larger?)
                    for (const r of activeRows) {
                        if (matrix[r][c1] > matrix[r][c2]) {
                            c1DominatesC2 = false; 
                            break;
                        }
                    }

                    if (c1DominatesC2) {
                        // c1 values are <= c2 values. B prefers c1. c2 is eliminated.
                        colsToDelete.push(c2);
                        steps.push(`Col ${input.playerBStrategies[c1]} dominates Col ${input.playerBStrategies[c2]}. Eliminating ${input.playerBStrategies[c2]}.`);
                        changed = true;
                    }
                }
            }
            if (colsToDelete.length > 0) {
                activeCols = activeCols.filter(c => !colsToDelete.includes(c));
                reduced = true;
            }
        }

        // 3. Solve remaining Matrix
        // If reduced to 1x1
        if (activeRows.length === 1 && activeCols.length === 1) {
            const r = activeRows[0];
            const c = activeCols[0];
            const val = matrix[r][c];
            const optA = new Array(numRows).fill(0); optA[r] = 1;
            const optB = new Array(numCols).fill(0); optB[c] = 1;
            return {
                hasSaddlePoint: true, // Effectively
                value: val,
                optimalStrategiesA: optA,
                optimalStrategiesB: optB,
                reductionSteps: steps,
                methodUsed: 'DOMINANCE'
            };
        }

        // If reduced to 2x2
        if (activeRows.length === 2 && activeCols.length === 2) {
            steps.push("Reduced to 2x2 Matrix. Using Analytical Formula.");
            const r1 = activeRows[0], r2 = activeRows[1];
            const c1 = activeCols[0], c2 = activeCols[1];
            
            const a11 = matrix[r1][c1];
            const a12 = matrix[r1][c2];
            const a21 = matrix[r2][c1];
            const a22 = matrix[r2][c2];

            // Formula for Player A (p1, p2)
            // p1 = (a22 - a21) / ((a11 + a22) - (a12 + a21))
            const denom = (a11 + a22) - (a12 + a21);
            
            // Check for singularity?
            if (Math.abs(denom) < 1e-9) {
                steps.push("Cannot solve 2x2 analytically (Denom=0).");
                return this.returnUnsolved(numRows, numCols, steps);
            }

            const p1 = (a22 - a21) / denom;
            const p2 = 1 - p1;

            // Formula for Player B (q1, q2)
            // q1 = (a22 - a12) / denom
            const q1 = (a22 - a12) / denom;
            const q2 = 1 - q1;

            const value = (a11 * a22 - a12 * a21) / denom;

            const optA = new Array(numRows).fill(0);
            optA[r1] = p1; optA[r2] = p2;

            const optB = new Array(numCols).fill(0);
            optB[c1] = q1; optB[c2] = q2;

            return {
                hasSaddlePoint: false,
                value,
                optimalStrategiesA: optA,
                optimalStrategiesB: optB,
                reductionSteps: steps,
                methodUsed: 'MIXED_2X2'
            };
        }

        // If larger, return placeholder
        steps.push(`Reduced Matrix size: ${activeRows.length}x${activeCols.length}. Analytical solver supports up to 2x2.`);
        
        return this.returnUnsolved(numRows, numCols, steps);
    }

    private static returnUnsolved(rows: number, cols: number, steps: string[]): GameTheoryResult {
        return {
            hasSaddlePoint: false,
            value: 0,
            optimalStrategiesA: new Array(rows).fill(0),
            optimalStrategiesB: new Array(cols).fill(0),
            reductionSteps: steps,
            methodUsed: 'LP' // Technically implied
        }
    }
}
