
import { Constraint, ConstraintSign, LPProblem, OptimizationType, SolverMethod, SolverStatus, SolverStep, TableauRow } from "../types";

// Deep copy helper
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export class LPEngine {
  
  public static getDualProblem(primal: LPProblem): LPProblem {
      const isMax = primal.type === OptimizationType.MAXIMIZE;
      const matrix = primal.constraints.map(c => c.coefficients);
      const rhs = primal.constraints.map(c => c.rhs);
      const obj = primal.objectiveCoefficients;

      // 1. Transpose Matrix
      const dualMatrix: number[][] = [];
      if (matrix.length > 0) {
          const rows = matrix.length;
          const cols = matrix[0].length;
          for (let j = 0; j < cols; j++) {
              const row = [];
              for (let i = 0; i < rows; i++) {
                  row.push(matrix[i][j]);
              }
              dualMatrix.push(row);
          }
      }

      // 2. New Type
      const dualType = isMax ? OptimizationType.MINIMIZE : OptimizationType.MAXIMIZE;

      // 3. New Constraints
      const dualConstraints: Constraint[] = dualMatrix.map((coeffs, idx) => {
          // Sign depends on variable restriction of Primal
          // Assuming standard non-negative primal variables:
          // Max Primal -> Min Dual: Constraints are >=
          // Min Primal -> Max Dual: Constraints are <=
          // Standard canonical form logic
          return {
              id: `dc-${idx}`,
              coefficients: coeffs,
              sign: isMax ? ConstraintSign.GREATER_EQ : ConstraintSign.LESS_EQ,
              rhs: obj[idx] || 0
          };
      });

      // 4. New Variables (y1, y2...) corresponding to Primal Constraints
      const dualVars = primal.constraints.map((_, i) => `y${i + 1}`);

      // 5. New Objective Coefficients = Primal RHS
      const dualObjCoeffs = rhs;

      return {
          type: dualType,
          variables: dualVars,
          objectiveCoefficients: dualObjCoeffs,
          constraints: dualConstraints,
          nonNegative: true // Standard assumption
      };
  }

  public static solve(problemInput: LPProblem, method: SolverMethod): SolverStep[] {
    const problem = clone(problemInput);
    const steps: SolverStep[] = [];
    const isMinimization = problem.type === OptimizationType.MINIMIZE;

    // 1. Pre-processing: Handle Negative RHS
    const initialNormalizationLogs: string[] = [];
    problem.constraints.forEach((c, idx) => {
        if (c.rhs < 0) {
            c.rhs = -c.rhs;
            c.coefficients = c.coefficients.map(v => -v);
            if (c.sign === ConstraintSign.LESS_EQ) c.sign = ConstraintSign.GREATER_EQ;
            else if (c.sign === ConstraintSign.GREATER_EQ) c.sign = ConstraintSign.LESS_EQ;
            initialNormalizationLogs.push(`Constraint ${idx + 1}: RHS < 0. Multiplied by -1, flipped sign.`);
        }
    });

    // 2. Setup Variables and Matrix
    const originalVars = problem.variables;
    const headers: string[] = [...originalVars];
    const colToVarName: string[] = [...originalVars];
    const matrix: number[][] = []; 
    const rhs: number[] = [];
    const basicVarIndices: number[] = []; 
    
    // Original Objective Function (Standardized to Maximize for internal calc)
    // If Min Z, we Maximize Z' = -Z.
    const originalObjCoeffs = problem.objectiveCoefficients.map(c => isMinimization ? -c : c);
    
    // Arrays to track variable types
    const artificialIndices: number[] = [];

    // Build Matrix & Add Slack/Surplus/Artificial
    problem.constraints.forEach((constraint, i) => {
        const row = [...constraint.coefficients];
        rhs.push(constraint.rhs);
        
        // Add 0s for existing extended vars
        while (row.length < headers.length) row.push(0);

        if (constraint.sign === ConstraintSign.LESS_EQ) {
            // Add Slack (s) -> coefficient +1
            const sName = `s${i+1}`;
            headers.push(sName);
            colToVarName.push(sName);
            row.push(1);
            // Fill previous rows
            matrix.forEach(r => r.push(0));
            basicVarIndices.push(headers.length - 1);
            
        } else if (constraint.sign === ConstraintSign.GREATER_EQ) {
            // Add Surplus (s) -> coefficient -1, and Artificial (a) -> coefficient +1
            // Note: Changed from 'e' (Excess) to 's' (Surplus) for standard notation consistency
            const sName = `s${i+1}`;
            const aName = `a${i+1}`;
            
            headers.push(sName);
            colToVarName.push(sName);
            row.push(-1); // Surplus subtracted
            matrix.forEach(r => r.push(0));

            headers.push(aName);
            colToVarName.push(aName);
            row.push(1); // Artificial added
            matrix.forEach(r => r.push(0));
            
            basicVarIndices.push(headers.length - 1);
            artificialIndices.push(headers.length - 1);
            
        } else if (constraint.sign === ConstraintSign.EQ) {
            // Add Artificial (a) -> coefficient +1
            const aName = `a${i+1}`;
            headers.push(aName);
            colToVarName.push(aName);
            row.push(1);
            matrix.forEach(r => r.push(0));
            
            basicVarIndices.push(headers.length - 1);
            artificialIndices.push(headers.length - 1);
        }
        
        matrix.push(row);
    });

    // Normalize Matrix rows length (in case last constraint added vars)
    matrix.forEach(row => {
        while(row.length < headers.length) row.push(0);
    });

    // Validation: Check if Simplex is valid
    if (method === SolverMethod.SIMPLEX && artificialIndices.length > 0) {
        throw new Error("Standard Simplex cannot solve problems with '>=' or '=' constraints requiring Artificial Variables. Please use Big M or Two-Phase method.");
    }

    // Generate Standard Form Equations
    const standardFormEquations: string[] = [];
    if (initialNormalizationLogs.length) standardFormEquations.push("--- Normalization ---", ...initialNormalizationLogs);
    standardFormEquations.push(`Objective: ${problem.type} Z = ${problem.objectiveCoefficients.map((c, i) => `${c}${problem.variables[i]}`).join(" + ")}`);
    standardFormEquations.push("--- Standard Form Constraints ---");
    matrix.forEach((row, i) => {
        const terms = row.map((c, j) => Math.abs(c) > 1e-6 ? `${c < 0 ? '-' : '+'}${Math.abs(c)}${colToVarName[j]}` : '').filter(Boolean).join(" ");
        standardFormEquations.push(`${terms.replace(/^\+/, '')} = ${rhs[i]}`);
    });

    // --- SOLVER LOGIC ---

    const getSolution = (currentBasis: number[], currentRhs: number[]) => {
        const sol: Record<string, number> = {};
        colToVarName.forEach(v => sol[v] = 0);
        for(let i=0; i<currentBasis.length; i++) {
            sol[colToVarName[currentBasis[i]]] = currentRhs[i];
        }
        return sol;
    };

    const runSimplexIterations = (
        initialDesc: string,
        currentCostVector: number[], // Cj for current phase
        phase: 1 | 2 | undefined,
        startIterationCount: number
    ) => {
        const MAX_ITERS = 20;
        let iter = 0;
        
        while (iter < MAX_ITERS) {
            iter++;
            
            // 1. Calculate Cb, Zj, Cj-Zj
            const Cb = basicVarIndices.map(idx => currentCostVector[idx]);
            const ZjRow = new Array(headers.length).fill(0);
            const NetEvalRow = new Array(headers.length).fill(0);
            
            for (let j = 0; j < headers.length; j++) {
                let zj = 0;
                for (let i = 0; i < basicVarIndices.length; i++) {
                    zj += Cb[i] * matrix[i][j];
                }
                ZjRow[j] = zj;
                NetEvalRow[j] = currentCostVector[j] - zj;
            }
            
            // Calculate Current Z value
            let currentZ = 0;
            for(let i=0; i<basicVarIndices.length; i++) currentZ += Cb[i] * rhs[i];

            // 2. Optimality Test (Maximization: Stop if all Cj-Zj <= 0)
            // Note: Floating point tolerance
            let maxPosDiff = 0;
            let pivotCol = -1;
            
            // Find entering variable (Most positive Cj-Zj for Max)
            for (let j = 0; j < headers.length; j++) {
                 // Don't pivot on artificials in Phase 2 (they are technically removed/zeroed)
                 if (phase === 2 && artificialIndices.includes(j)) continue;

                 if (NetEvalRow[j] > 1e-9 && NetEvalRow[j] > maxPosDiff) {
                     maxPosDiff = NetEvalRow[j];
                     pivotCol = j;
                 }
            }

            const currentState: TableauRow[] = matrix.map((row, i) => ({
                basicVar: colToVarName[basicVarIndices[i]],
                basicVarCost: Cb[i],
                coefficients: [...row],
                rhs: rhs[i],
                ratio: null
            }));

            // OPTIMAL?
            if (pivotCol === -1) {
                // If Phase 1, check if artificials are zero
                if (phase === 1) {
                    if (Math.abs(currentZ) > 1e-6) {
                        steps.push({
                            stepIndex: steps.length + 1,
                            phase,
                            description: "Phase 1 Optimal reached but W > 0. Artificial variables remain positive. INFEASIBLE SOLUTION.",
                            tableau: currentState, headers, cjRow: [...currentCostVector], zjRow: ZjRow, netEvaluationRow: NetEvalRow,
                            isOptimal: true, status: 'INFEASIBLE', zValue: currentZ
                        });
                        return 'INFEASIBLE';
                    } else {
                         steps.push({
                            stepIndex: steps.length + 1,
                            phase,
                            description: "Phase 1 Optimal reached with W = 0. Feasible solution found. Proceeding to Phase 2.",
                            tableau: currentState, headers, cjRow: [...currentCostVector], zjRow: ZjRow, netEvaluationRow: NetEvalRow,
                            isOptimal: true, status: 'IN_PROGRESS', zValue: currentZ
                        });
                        return 'PROCEED_PHASE_2';
                    }
                }

                // Normal Optimality
                let status: SolverStatus = 'OPTIMAL';
                // Check Alternate Solution: Non-basic var with 0 net eval
                const altSol = NetEvalRow.some((val, j) => !basicVarIndices.includes(j) && Math.abs(val) < 1e-6 && (!artificialIndices.includes(j)));
                if (altSol) status = 'ALTERNATIVE_SOLUTION';

                steps.push({
                    stepIndex: steps.length + 1,
                    phase,
                    description: phase === 2 ? "Phase 2 Optimality Reached. All Cj - Zj <= 0." : "Optimality Reached.",
                    tableau: currentState, headers, cjRow: [...currentCostVector], zjRow: ZjRow, netEvaluationRow: NetEvalRow,
                    isOptimal: true, status, solution: getSolution(basicVarIndices, rhs), zValue: isMinimization ? -currentZ : currentZ
                });
                return 'OPTIMAL';
            }

            // 3. Ratio Test
            let minRatio = Infinity;
            let pivotRow = -1;
            const ratios: (number|null)[] = [];
            
            for (let i = 0; i < matrix.length; i++) {
                const val = matrix[i][pivotCol];
                if (val > 1e-9) {
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

            // UNBOUNDED?
            if (pivotRow === -1) {
                steps.push({
                    stepIndex: steps.length + 1,
                    phase,
                    description: "All coefficients in pivot column are non-positive. Solution is UNBOUNDED.",
                    tableau: currentState, headers, cjRow: [...currentCostVector], zjRow: ZjRow, netEvaluationRow: NetEvalRow,
                    pivotColIdx: pivotCol,
                    enteringVar: colToVarName[pivotCol],
                    isOptimal: false, status: 'UNBOUNDED', zValue: isMinimization ? -currentZ : currentZ
                });
                return 'UNBOUNDED';
            }

            // Record Step BEFORE pivoting
            currentState.forEach((r, i) => r.ratio = ratios[i]);
            
            steps.push({
                stepIndex: steps.length + 1,
                phase,
                description: iter === 1 && steps.length === 0 ? initialDesc : `Iteration ${steps.length}: Enter ${colToVarName[pivotCol]}, Leave ${colToVarName[basicVarIndices[pivotRow]]}.`,
                tableau: currentState, headers, cjRow: [...currentCostVector], zjRow: ZjRow, netEvaluationRow: NetEvalRow,
                pivotColIdx: pivotCol, pivotRowIdx: pivotRow,
                enteringVar: colToVarName[pivotCol], leavingVar: colToVarName[basicVarIndices[pivotRow]],
                isOptimal: false, status: 'IN_PROGRESS', zValue: isMinimization ? -currentZ : currentZ,
                standardFormEquations: steps.length === 0 ? standardFormEquations : undefined
            });

            // 4. Pivot
            const pivotVal = matrix[pivotRow][pivotCol];
            const ops: string[] = [];
            
            // Normalize pivot row
            if (Math.abs(pivotVal - 1) > 1e-9) {
                ops.push(`R${pivotRow+1} = R${pivotRow+1} / ${pivotVal.toFixed(2)}`);
                for (let j = 0; j < matrix[pivotRow].length; j++) matrix[pivotRow][j] /= pivotVal;
                rhs[pivotRow] /= pivotVal;
            }

            // Eliminate other rows
            for (let i = 0; i < matrix.length; i++) {
                if (i !== pivotRow) {
                    const factor = matrix[i][pivotCol];
                    if (Math.abs(factor) > 1e-9) {
                        ops.push(`R${i+1} = R${i+1} ${factor > 0 ? '-' : '+'} ${Math.abs(factor).toFixed(2)} * R${pivotRow+1}`);
                        for (let j = 0; j < matrix[i].length; j++) matrix[i][j] -= factor * matrix[pivotRow][j];
                        rhs[i] -= factor * rhs[pivotRow];
                    }
                }
            }
            
            // Update Basis
            basicVarIndices[pivotRow] = pivotCol;
            
            // Store ops in the NEXT step (or attach to this one? usually displayed with the next tableau)
            // We'll attach to the next step when created.
        }
        
        return 'MAX_ITER';
    };

    // --- EXECUTION ---

    if (method === SolverMethod.TWO_PHASE && artificialIndices.length > 0) {
        // PHASE 1: Min sum of artificials (Max -sum a_i)
        const phase1Costs = new Array(headers.length).fill(0);
        artificialIndices.forEach(idx => phase1Costs[idx] = -1); // Maximize -a1 -a2...

        const res1 = runSimplexIterations("Phase 1 Initialization: Minimize sum of artificial variables.", phase1Costs, 1, 0);
        
        if (res1 === 'PROCEED_PHASE_2') {
            // PHASE 2: Restore original costs
            // Construct Cj for Phase 2
            const phase2Costs = new Array(headers.length).fill(0);
            originalVars.forEach((v, i) => phase2Costs[i] = originalObjCoeffs[i]);
            // Slack/Surplus have 0 cost
            
            // IMPORTANT: Remove artificial columns visually or just ignore them? 
            // Academic approach: usually drop them. 
            // Implementation: We'll set their costs to 0 and ensure they don't enter basis.
            // Or better, filter headers. For simplicity, we keep matrix size but ignore them.
            
            runSimplexIterations("Phase 2 Start: Original Objective Function restored.", phase2Costs, 2, steps.length);
        }
    } 
    else if (method === SolverMethod.BIG_M && artificialIndices.length > 0) {
        // Big M Costs
        const M = 1000;
        const bigMCosts = new Array(headers.length).fill(0);
        
        // Original costs
        originalVars.forEach((v, i) => bigMCosts[i] = originalObjCoeffs[i]);
        
        // Artificial costs = -M (Max)
        artificialIndices.forEach(idx => bigMCosts[idx] = -M);

        runSimplexIterations(`Initialization: Big M Method (M=${M}).`, bigMCosts, undefined, 0);
    } 
    else {
        // Standard Simplex (or Big M/Two Phase if no artificials needed)
        const simpleCosts = new Array(headers.length).fill(0);
        originalVars.forEach((v, i) => simpleCosts[i] = originalObjCoeffs[i]);
        
        runSimplexIterations("Initialization: Standard Simplex.", simpleCosts, undefined, 0);
    }

    return steps;
  }
}
