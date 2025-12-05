import { Constraint, ConstraintSign, LPProblem, OptimizationType, SolverMethod, SolverStatus, SolverStep, TableauRow } from "../types";

// Deep copy helper
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export class LPEngine {
  
  public static solve(problem: LPProblem, method: SolverMethod): SolverStep[] {
    // 1. Normalize Problem: Convert Minimize Z to Maximize (-Z)
    // We will solve everything as a Maximization problem internally.
    // If original was Minimize, we flip the final Z value.
    const isMinimization = problem.type === OptimizationType.MINIMIZE;
    
    // Adjust Objective Coefficients for Internal Maximization
    // Max Z = c1x1 + ... -> coeffs are [c1, c2...]
    // Min Z = c1x1 + ... -> Max W = -Z = -c1x1 - ... -> coeffs are [-c1, -c2...]
    const objectiveCoeffs = problem.objectiveCoefficients.map(c => isMinimization ? -c : c);

    const steps: SolverStep[] = [];
    
    // 2. Setup Variables
    // Basics: x1, x2...
    // Slacks: s1, s2... (for <=)
    // Surplus: e1, e2... (for >=)
    // Artificial: a1, a2... (for = or >=)
    
    let numVars = problem.variables.length;
    let numConstraints = problem.constraints.length;
    
    const headers: string[] = [...problem.variables];
    const colToVarName: string[] = [...problem.variables];
    
    // Track indices
    const basicVarIndices: number[] = []; // Row i corresponds to variable at index k
    const matrix: number[][] = []; // Constraint coefficients
    const rhs: number[] = [];
    
    // Big M value
    const M = 10000;

    // Augmented Objective Function Row (Z - Sum(cX) = 0)
    // We store 'Cj' separately to build the Z-row (Cj - Zj) logic or direct row manipulation.
    // Standard Simplex Row 0 format: Z + sum(-c_j * x_j) = RHS
    // So initial coeffs for decision vars are -c_j.
    let zRow = objectiveCoeffs.map(c => -c);
    
    // We need to extend zRow as we add columns
    
    // 3. Build Augmented Matrix
    problem.constraints.forEach((constraint, i) => {
        const row = [...constraint.coefficients];
        rhs.push(constraint.rhs);
        
        // Handle Inequality/Equality
        if (constraint.sign === ConstraintSign.LESS_EQ) {
            // Add Slack (+s)
            const sName = `s${i+1}`;
            headers.push(sName);
            colToVarName.push(sName);
            
            // Add 1 to this row, 0 to others
            // Push 0 to existing rows for this new col
            matrix.forEach(r => r.push(0)); 
            // Current row gets 1
            row.push(1);
            // Z-row gets 0
            zRow.push(0);
            
            // Slack is basic
            basicVarIndices.push(headers.length - 1);
            
        } else if (constraint.sign === ConstraintSign.GREATER_EQ) {
            // Add Surplus (-e) and Artificial (+a)
            // Big M: Coeff of a in Objective is -M (for Max). 
            // In Row 0 (Z - ...), this becomes +M.
            
            const eName = `e${i+1}`;
            const aName = `a${i+1}`;
            
            // Surplus
            headers.push(eName);
            colToVarName.push(eName);
            matrix.forEach(r => r.push(0));
            row.push(-1);
            zRow.push(0); // Surplus has 0 cost
            
            // Artificial
            headers.push(aName);
            colToVarName.push(aName);
            matrix.forEach(r => r.push(0));
            row.push(1);
            
            // For Big M Maximize: Coeff is -M. In Z-equation: Z - (-M)a ... => Z + M a ...
            // However, we usually eliminate M from Z-row immediately. 
            // Let's store -M in the conceptual cost array, but in the tableau row 0, 
            // we will perform the elimination step (Z_new = Z_old - M * ConstraintRow).
            // For now, put 0 and we will adjust Z-row after building matrix.
            zRow.push(0); 
            
            // Artificial is basic
            basicVarIndices.push(headers.length - 1);
            
        } else if (constraint.sign === ConstraintSign.EQ) {
            // Add Artificial (+a)
            const aName = `a${i+1}`;
            headers.push(aName);
            colToVarName.push(aName);
            
            matrix.forEach(r => r.push(0));
            row.push(1);
            zRow.push(0); 
            
            basicVarIndices.push(headers.length - 1);
        }
        
        matrix.push(row);
    });

    // 4. Initial Z-Row Adjustment for Big M
    // If we have artificial variables, their cost is -M (max). 
    // Current Z-row is Z - sum(c_orig * x). We need to subtract M * (sum(a_i)) effectively 
    // to zero out the M coefficients in the Z-row for the basic variables.
    // Easier approach: Calculate Z-row = Sum(C_B * Row) - C_j.
    // Let's re-calculate Z-row dynamically from Basis to ensure correctness.
    
    // Helper to get cost of a variable index
    const getCost = (colIdx: number): number => {
        const name = colToVarName[colIdx];
        // Decision variable?
        const decIdx = problem.variables.indexOf(name);
        if (decIdx !== -1) return objectiveCoeffs[decIdx];
        
        // Slack/Surplus?
        if (name.startsWith('s') || name.startsWith('e')) return 0;
        
        // Artificial?
        if (name.startsWith('a')) return -M; // Penalty for Max
        
        return 0;
    };

    const calculateZRow = (): number[] => {
        const rowC = new Array(headers.length).fill(0);
        
        // For each column j
        for (let j = 0; j < headers.length; j++) {
            let zj = 0;
            // Zj = Sum(C_Bi * a_ij)
            for (let i = 0; i < numConstraints; i++) {
                const basisIdx = basicVarIndices[i];
                const c_basis = getCost(basisIdx);
                zj += c_basis * matrix[i][j];
            }
            const cj = getCost(j);
            // For max tableau, usually we show (Zj - Cj) or (Cj - Zj).
            // Standard "Z row" in many textbooks for Max is (Zj - Cj).
            // Optimality reached when all (Zj - Cj) >= 0.
            // WAIT: Most textbooks say Row 0 is Z + ... = RHS.
            // If Z = C x, then Z - C x = 0. 
            // The coefficients are -C. 
            // If we pivot, we maintain this. 
            // Let's use the definition: value in cell is (Zj - Cj).
            // Max is optimal when all (Zj - Cj) >= 0.
            rowC[j] = zj - cj;
        }
        return rowC;
    };
    
    // Initial Z Row
    let currentRow0 = calculateZRow();
    
    // Calculate initial Z value
    const calculateCurrentZ = (): number => {
        let z = 0;
        for(let i=0; i<numConstraints; i++) {
            const basisIdx = basicVarIndices[i];
            const c_basis = getCost(basisIdx);
            z += c_basis * rhs[i];
        }
        return z;
    };
    
    // Helper to extract solution for display
    const getSolutionObj = (): Record<string, number> => {
        const sol: Record<string, number> = {};
        problem.variables.forEach(v => sol[v] = 0);
        for(let i=0; i<numConstraints; i++) {
            const name = colToVarName[basicVarIndices[i]];
            if (problem.variables.includes(name)) {
                sol[name] = rhs[i];
            }
        }
        return sol;
    };

    // Helper to build TableauRow structure for UI
    const buildTableauState = (
        desc: string, 
        pivotRow?: number, 
        pivotCol?: number,
        ratios?: (number | null)[],
        status: SolverStatus = 'IN_PROGRESS',
        isOptimal: boolean = false
    ): SolverStep => {
        
        // We display the negated Z-row if standard form implies it, but let's stick to (Zj - Cj)
        // Optimality Condition for Max: All (Zj - Cj) >= 0.
        
        const tableauRows: TableauRow[] = matrix.map((row, i) => ({
            basicVar: colToVarName[basicVarIndices[i]],
            coefficients: [...row],
            rhs: rhs[i],
            ratio: ratios ? ratios[i] : null
        }));

        const currentZ = calculateCurrentZ();

        // Check for Alternative Solution if optimal
        if (isOptimal) {
            // If any non-basic variable has 0 in Z-row, it's an alternative solution
            // (Exclude artificials which should be 0 anyway if out of basis? No, artificials usually have large penalty)
            const hasAlternative = currentRow0.some((val, idx) => {
                const isBasic = basicVarIndices.includes(idx);
                const isArtificial = colToVarName[idx].startsWith('a');
                return !isBasic && !isArtificial && Math.abs(val) < 1e-6;
            });
            if (hasAlternative && status === 'OPTIMAL') {
                status = 'ALTERNATIVE_SOLUTION';
                desc += " (Alternative solutions exist because a non-basic variable has 0 reduced cost).";
            }
        }

        return {
            stepIndex: steps.length + 1,
            description: desc,
            tableau: tableauRows,
            headers: headers,
            zRow: [...currentRow0],
            pivotRowIdx: pivotRow,
            pivotColIdx: pivotCol,
            enteringVar: pivotCol !== undefined ? colToVarName[pivotCol] : undefined,
            leavingVar: pivotRow !== undefined ? colToVarName[basicVarIndices[pivotRow]] : undefined,
            isOptimal,
            status,
            solution: getSolutionObj(),
            zValue: isMinimization ? -currentZ : currentZ 
        };
    };

    // --- ITERATION LOOP ---
    const MAX_ITERATIONS = 20;
    let iteration = 0;

    // Initial Step
    steps.push(buildTableauState("Initial Tableau setup with Slack/Surplus/Artificial variables."));

    while (iteration < MAX_ITERATIONS) {
        iteration++;
        
        // 1. Check Optimality
        // For Maximize (Zj - Cj), optimal if all >= -epsilon
        // We look for most negative value to improve.
        let minVal = 0;
        let pivotCol = -1;
        
        for (let j = 0; j < headers.length; j++) {
            if (currentRow0[j] < minVal - 1e-9) { // Tolerance
                minVal = currentRow0[j];
                pivotCol = j;
            }
        }

        if (pivotCol === -1) {
            // Optimal!
            // Check for Infeasibility: Is there an artificial variable in basis with value > 0?
            const artificialInBasis = basicVarIndices.some((idx, i) => {
                const name = colToVarName[idx];
                return name.startsWith('a') && rhs[i] > 1e-6;
            });

            if (artificialInBasis) {
                const finalStep = buildTableauState("Optimality conditions met, but Artificial Variable remains in basis > 0.", undefined, undefined, undefined, 'INFEASIBLE', false);
                steps.push(finalStep);
                return steps;
            }

            const finalStep = buildTableauState("Optimality Reached. All Z-row coefficients are non-negative.", undefined, undefined, undefined, 'OPTIMAL', true);
            steps.push(finalStep);
            return steps;
        }

        // 2. Ratio Test
        let minRatio = Infinity;
        let pivotRow = -1;
        const ratios: (number | null)[] = [];

        for (let i = 0; i < numConstraints; i++) {
            const val = matrix[i][pivotCol];
            if (val > 1e-9) { // Strictly positive
                const ratio = rhs[i] / val;
                ratios.push(ratio);
                if (ratio < minRatio) {
                    minRatio = ratio;
                    pivotRow = i;
                }
            } else {
                ratios.push(null);
            }
        }

        if (pivotRow === -1) {
            // Unbounded
            const unboundStep = buildTableauState(
                `Entering variable ${colToVarName[pivotCol]} can increase indefinitely. No positive pivot element found.`, 
                undefined, pivotCol, ratios, 'UNBOUNDED', false
            );
            steps.push(unboundStep);
            return steps;
        }

        // 3. Record Pre-Pivot Step (showing selection)
        steps.push(buildTableauState(
            `Pivot selection: Enter ${colToVarName[pivotCol]} (most negative Z), Leave ${colToVarName[basicVarIndices[pivotRow]]} (min ratio ${minRatio.toFixed(2)}).`, 
            pivotRow, 
            pivotCol, 
            ratios
        ));

        // 4. Pivot Operation
        const pivotVal = matrix[pivotRow][pivotCol];
        
        // Divide pivot row by pivot val
        for (let j = 0; j < matrix[pivotRow].length; j++) {
            matrix[pivotRow][j] /= pivotVal;
        }
        rhs[pivotRow] /= pivotVal;
        
        // Update basic variable tracker
        basicVarIndices[pivotRow] = pivotCol;
        
        // Eliminate other rows
        for (let i = 0; i < numConstraints; i++) {
            if (i !== pivotRow) {
                const factor = matrix[i][pivotCol];
                for (let j = 0; j < matrix[i].length; j++) {
                    matrix[i][j] -= factor * matrix[pivotRow][j];
                }
                rhs[i] -= factor * rhs[pivotRow];
            }
        }
        
        // Re-calculate Z-row completely based on new basis to avoid accumulating floating point errors
        currentRow0 = calculateZRow();
    }
    
    // Max iterations reached
    steps.push(buildTableauState("Maximum iterations reached. Process terminated.", undefined, undefined, undefined, 'IN_PROGRESS', false));
    return steps;
  }
}
