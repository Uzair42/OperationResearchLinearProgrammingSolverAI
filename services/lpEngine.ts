import { ConstraintSign, LPProblem, OptimizationType, SolverMethod, SolverStep, TableauRow } from "../types";

// Helper to deep copy steps
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export class LPEngine {
  
  // Solves the problem and returns a history of steps
  static solve(problem: LPProblem, method: SolverMethod): SolverStep[] {
    // 1. Pre-processing: Standardize
    // For simplicity in this demo, we convert MIN to MAX by negating objective
    // We handle slack/surplus/artificial variables based on method.
    
    let steps: SolverStep[] = [];
    const isMin = problem.type === OptimizationType.MINIMIZE;
    
    // Initial coefficients (negated if minimization)
    let objCoeffs = problem.objectiveCoefficients.map(c => isMin ? -c : c);
    
    // Prepare Tableau Headers & Matrix
    let headers = [...problem.variables];
    let matrix: number[][] = problem.constraints.map(c => [...c.coefficients]); // Rows of coeff
    let rhs = problem.constraints.map(c => c.rhs);
    let basicVars: string[] = []; // The variables currently in the basis
    
    // Add Slack/Surplus/Artificial variables
    // Simple Simplex: Assumes all constraints are <= and RHS >= 0
    // Big M: Handles >= and = by adding Artificial vars + Penalty
    
    const M = 1000; // Large number for Big M
    let zRow = [...objCoeffs.map(c => -c)]; // Z - Cj = 0 -> Z + (-Cj)xj = 0. So initial row is -Coeffs.
    
    // Extend zRow for basic variables later
    
    let slackCount = 0;
    let artificialCount = 0;
    
    // Process constraints to build initial matrix
    problem.constraints.forEach((c, idx) => {
        if (c.sign === ConstraintSign.LESS_EQ) {
            // Add Slack (+s)
            slackCount++;
            const sName = `s${slackCount}`;
            headers.push(sName);
            basicVars.push(sName);
            
            // Update matrix rows
            matrix.forEach((row, rIdx) => {
                row.push(rIdx === idx ? 1 : 0);
            });
            // Update Z row
            zRow.push(0); 

        } else if (c.sign === ConstraintSign.GREATER_EQ) {
            // Add Surplus (-s) and Artificial (+a)
            slackCount++;
            artificialCount++;
            const sName = `s${slackCount}`;
            const aName = `a${artificialCount}`;
            
            headers.push(sName);
            headers.push(aName);
            basicVars.push(aName); // Artificial starts in basis
            
            matrix.forEach((row, rIdx) => {
                row.push(rIdx === idx ? -1 : 0); // Surplus
                row.push(rIdx === idx ? 1 : 0);  // Artificial
            });
            
            zRow.push(0); // Surplus cost 0
            
            // Artificial cost: -M in objective (for MAX). 
            // In Tableau (Z row): Coefficient becomes +M or handled via row operations to zero out A columns.
            // For standard tableau form Z + ... = 0, initial Z row entry is -(coeff).
            // Coeff is -M. So entry is +M? 
            // Correct approach: Set Coeff of A to -M. Z row initially should zero out A columns.
            // We'll handle Big M pre-processing below.
            zRow.push(method === SolverMethod.BIG_M ? M : 0); // Placeholder
        } else {
             // Equality (=) -> Add Artificial (+a)
             artificialCount++;
             const aName = `a${artificialCount}`;
             headers.push(aName);
             basicVars.push(aName);
             
             matrix.forEach((row, rIdx) => {
                row.push(rIdx === idx ? 1 : 0);
             });
             zRow.push(method === SolverMethod.BIG_M ? M : 0);
        }
    });

    // If Big M, we need to eliminate M from Z-row for basic variables (Artificials)
    if (method === SolverMethod.BIG_M && artificialCount > 0) {
        // Current Z row has M in artificial columns. We need to subtract M * (sum of artificial rows)
        // Actually, easier way: 
        // Initial Z equation: Z - sum(cj * xj) = 0.
        // For basic columns (Artificials), the value in Z row must be 0.
        // We assume cost is -M (since we want to get rid of them in Max problem).
        // Standard procedure: Row operations to make basis columns 0 in Z row.
        
        // Let's reconstruction Z row properly.
        // C_B (Costs of basic vars).
        // Z_j - C_j.
        
        // Re-calculate Z row based on C_B * B^-1 * A - C.
        // Too complex. Let's stick to row operations.
        // For every artificial variable 'a' in row 'r', subtract M * row 'r' from Z-row?
        // No, add M * row 'r' to Z-row (if Z row represents cost).
        
        // Simplified Logic for Demo:
        // 1. Z row currently has 0 for slacks, and we'll ignore the M placeholders above for a sec.
        // 2. Real Objective function is: Max Z = C*x - M*a.
        // 3. Z - C*x + M*a = 0.
        // 4. Pivot operations will naturally handle it if we start with correct Z row.
        // BUT, 'a' is in basis. So 'a' column in Z-row MUST be 0.
        // To make 'a' column 0, we take the equation involving 'a' (the constraint) and substitute.
        
        // Let's restart Z-row calculation for Big M:
        // Z_row = -ObjectiveCoeffs.
        // For Artificials, coeff is -M. So in Z-row (Z + ...), it appears as +M.
        // But A is basic, so we must pivot on A to make it 0.
        // Equivalent to: Z_new = Z_old - M * (Sum of rows containing A).
        
        // Reset Z row to matches objective:
        zRow = headers.map(h => {
             const vIdx = problem.variables.indexOf(h);
             if (vIdx > -1) return -objCoeffs[vIdx]; // Original vars
             if (h.startsWith('s')) return 0; // Slacks
             if (h.startsWith('a')) return M; // Artificials (Penalty)
             return 0;
        });

        // Now, zero out the artificial columns in Z row
        headers.forEach((h, colIdx) => {
            if (h.startsWith('a')) {
                 // Find the row where this 'a' is 1
                 const rowIdx = matrix.findIndex(row => row[colIdx] === 1);
                 if (rowIdx !== -1) {
                     // Z_row = Z_row - M * Row
                     for(let i=0; i<zRow.length; i++) {
                         zRow[i] -= M * matrix[rowIdx][i];
                     }
                     // Also adjust the RHS of Z (current Z value)
                     // Typically Z value is stored separately or as last col.
                     // Let's store current negative Z value in a separate variable for calculation, 
                     // but for display, usually RHS column of Z row.
                 }
            }
        });
    }

    // Step 0: Initial State
    let currentRHS = [...rhs];
    let currentZValue = 0;
    
    // If Big M adjusted Z-row, update starting Z value
    if (method === SolverMethod.BIG_M && artificialCount > 0) {
        // Z value adjustment
         headers.forEach((h, colIdx) => {
            if (h.startsWith('a')) {
                 const rowIdx = matrix.findIndex(row => row[colIdx] === 1);
                 if (rowIdx !== -1) {
                     currentZValue -= M * currentRHS[rowIdx];
                 }
            }
        });
    }

    const MAX_ITERATIONS = 20;
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
        // Construct Tableau Data for the Step
        const tableauRows: TableauRow[] = matrix.map((row, i) => ({
            basicVar: basicVars[i],
            coefficients: [...row],
            rhs: currentRHS[i],
            ratio: null
        }));

        // 1. Check Optimality: Are all Z-row coeffs >= 0? (For Maximization standard form)
        // Note: floating point tolerance is needed.
        const isOptimal = zRow.every(val => val >= -0.00001);

        if (isOptimal) {
            steps.push({
                stepIndex: iteration + 1,
                description: "Optimality condition satisfied. All coefficients in Z-row are non-negative.",
                tableau: tableauRows,
                headers,
                zRow: [...zRow],
                isOptimal: true,
                status: 'OPTIMAL',
                zValue: isMin ? -(-currentZValue) : -currentZValue, // Flip back if needed (Note: Simplex Z usually keeps -Z value on RHS or similar)
                solution: extractSolution(basicVars, currentRHS, problem.variables)
            });
            break;
        }

        // 2. Determine Entering Variable (Most negative in Z row)
        let minVal = 0;
        let enteringColIdx = -1;
        zRow.forEach((val, idx) => {
            if (val < minVal) {
                minVal = val;
                enteringColIdx = idx;
            }
        });

        const enteringVarName = headers[enteringColIdx];

        // 3. Determine Leaving Variable (Minimum Ratio Test)
        let minRatio = Infinity;
        let leavingRowIdx = -1;

        tableauRows.forEach((row, idx) => {
            const denom = row.coefficients[enteringColIdx];
            if (denom > 0.00001) {
                const ratio = row.rhs / denom;
                row.ratio = parseFloat(ratio.toFixed(4)); // Store for UI
                if (ratio < minRatio) {
                    minRatio = ratio;
                    leavingRowIdx = idx;
                }
            } else {
                row.ratio = null; // Infinite or undefined
            }
        });

        if (leavingRowIdx === -1) {
             steps.push({
                stepIndex: iteration + 1,
                description: "Problem is Unbounded. No valid leaving variable found.",
                tableau: tableauRows,
                headers,
                zRow: [...zRow],
                isOptimal: false,
                status: 'UNBOUNDED'
            });
            break;
        }

        const leavingVarName = basicVars[leavingRowIdx];

        // Save Step before pivoting
        steps.push({
            stepIndex: iteration + 1,
            description: `Iteration ${iteration + 1}: ${enteringVarName} enters, ${leavingVarName} leaves. Pivot at row ${leavingRowIdx + 1}, col ${enteringColIdx + 1}.`,
            tableau: clone(tableauRows),
            headers,
            zRow: [...zRow],
            pivotRowIdx: leavingRowIdx,
            pivotColIdx: enteringColIdx,
            enteringVar: enteringVarName,
            leavingVar: leavingVarName,
            isOptimal: false,
            status: 'IN_PROGRESS',
            zValue: isMin ? -(-currentZValue) : -currentZValue
        });

        // 4. Pivot
        const pivotElement = matrix[leavingRowIdx][enteringColIdx];
        
        // Normalize pivot row
        for (let j = 0; j < headers.length; j++) {
            matrix[leavingRowIdx][j] /= pivotElement;
        }
        currentRHS[leavingRowIdx] /= pivotElement;

        // Eliminate other rows
        for (let i = 0; i < matrix.length; i++) {
            if (i !== leavingRowIdx) {
                const factor = matrix[i][enteringColIdx];
                for (let j = 0; j < headers.length; j++) {
                    matrix[i][j] -= factor * matrix[leavingRowIdx][j];
                }
                currentRHS[i] -= factor * currentRHS[leavingRowIdx];
            }
        }

        // Update Z Row
        const zFactor = zRow[enteringColIdx];
        for (let j = 0; j < headers.length; j++) {
            zRow[j] -= zFactor * matrix[leavingRowIdx][j];
        }
        currentZValue -= zFactor * currentRHS[leavingRowIdx];

        // Update Basic Vars
        basicVars[leavingRowIdx] = enteringVarName;

        iteration++;
    }
    
    // Post-process solution to match optimization type
    if (steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        if (lastStep.status === 'OPTIMAL' && isMin && lastStep.zValue !== undefined) {
             // For MIN problems solved as MAX, the Z value is inverted.
             // But wait, we inverted Cj at start. Max(-Z) = -Min(Z).
             // So calculated Z is -OptimalValue.
             lastStep.zValue = -lastStep.zValue;
        }
    }

    return steps;
  }
}

function extractSolution(basicVars: string[], rhs: number[], originalVars: string[]): Record<string, number> {
    const sol: Record<string, number> = {};
    originalVars.forEach(v => sol[v] = 0);
    
    basicVars.forEach((bv, idx) => {
        if (originalVars.includes(bv)) {
            sol[bv] = parseFloat(rhs[idx].toFixed(4));
        }
    });
    return sol;
}
