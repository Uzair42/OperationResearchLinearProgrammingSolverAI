import { Constraint, ConstraintSign, LPProblem, OptimizationType, SolverMethod, SolverStatus, SolverStep, TableauRow } from "../types";

// Deep copy helper
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export class LPEngine {
  
  public static solve(problemInput: LPProblem, method: SolverMethod): SolverStep[] {
    // Clone input to avoid mutating the original object during normalization
    const problem = clone(problemInput);

    const steps: SolverStep[] = [];
    
    // --- PREPROCESSING: HANDLE NEGATIVE RHS (Inequality in Wrong Direction) ---
    // Case (2): If RHS is negative, multiply entire constraint by -1 and flip sign.
    const initialNormalizationLogs: string[] = [];
    problem.constraints.forEach((c, idx) => {
        if (c.rhs < 0) {
            c.rhs = -c.rhs;
            c.coefficients = c.coefficients.map(v => -v);
            const oldSign = c.sign;
            if (c.sign === ConstraintSign.LESS_EQ) c.sign = ConstraintSign.GREATER_EQ;
            else if (c.sign === ConstraintSign.GREATER_EQ) c.sign = ConstraintSign.LESS_EQ;
            initialNormalizationLogs.push(`Constraint ${idx + 1} had negative RHS. Multiplied by -1 and flipped sign from ${oldSign} to ${c.sign}.`);
        }
    });

    // Case (1): Normalize Problem: Convert Minimize Z to Maximize (-Z)
    const isMinimization = problem.type === OptimizationType.MINIMIZE;
    const objectiveCoeffs = problem.objectiveCoefficients.map(c => isMinimization ? -c : c);

    // 2. Setup Variables
    let numVars = problem.variables.length;
    let numConstraints = problem.constraints.length;
    
    const headers: string[] = [...problem.variables];
    const colToVarName: string[] = [...problem.variables];
    
    // Track indices
    const basicVarIndices: number[] = []; 
    const matrix: number[][] = []; 
    const rhs: number[] = [];
    
    // Big M value
    const M = 10000;

    // Augmented Objective Function Row
    let zRow = objectiveCoeffs.map(c => -c); // In tableau: Z - (c1x1 + ...) = 0  =>  Z + (-c1)x1 ...
    
    // 3. Build Augmented Matrix & Standard Form Strings
    problem.constraints.forEach((constraint, i) => {
        const row = [...constraint.coefficients];
        rhs.push(constraint.rhs);
        
        if (constraint.sign === ConstraintSign.LESS_EQ) {
            const sName = `s${i+1}`;
            headers.push(sName);
            colToVarName.push(sName);
            matrix.forEach(r => r.push(0)); 
            row.push(1);
            zRow.push(0);
            basicVarIndices.push(headers.length - 1);
            
        } else if (constraint.sign === ConstraintSign.GREATER_EQ) {
            const eName = `e${i+1}`;
            const aName = `a${i+1}`;
            headers.push(eName);
            colToVarName.push(eName);
            matrix.forEach(r => r.push(0));
            row.push(-1);
            zRow.push(0); 
            
            headers.push(aName);
            colToVarName.push(aName);
            matrix.forEach(r => r.push(0));
            row.push(1);
            zRow.push(0); 
            
            basicVarIndices.push(headers.length - 1);
            
        } else if (constraint.sign === ConstraintSign.EQ) {
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

    // Generate Standard Form Equations
    const standardFormEquations: string[] = [];
    
    // Add normalization logs to equations list or description
    if (initialNormalizationLogs.length > 0) {
        standardFormEquations.push("--- Normalization ---");
        initialNormalizationLogs.forEach(l => standardFormEquations.push(l));
        standardFormEquations.push("--- Standard Form ---");
    }

    matrix.forEach((row, i) => {
        const terms: string[] = [];
        row.forEach((coef, j) => {
            if (Math.abs(coef) > 1e-6) {
                const val = Math.abs(coef);
                const sign = coef < 0 ? "- " : "+ ";
                const name = colToVarName[j];
                const valStr = Math.abs(val - 1) < 1e-6 ? "" : parseFloat(val.toFixed(2));
                // Handle first term formatting
                if (terms.length === 0) {
                    terms.push(`${coef < 0 ? "-" : ""}${valStr}${name}`);
                } else {
                    terms.push(`${sign}${valStr}${name}`);
                }
            }
        });
        standardFormEquations.push(`${terms.join(" ")} = ${rhs[i]}`);
    });

    // 4. Initial Z-Row Adjustment for Big M
    const getCost = (colIdx: number): number => {
        const name = colToVarName[colIdx];
        const decIdx = problem.variables.indexOf(name);
        if (decIdx !== -1) return objectiveCoeffs[decIdx];
        if (name.startsWith('s') || name.startsWith('e')) return 0;
        if (name.startsWith('a')) return -M; 
        return 0;
    };

    const calculateZRow = (): number[] => {
        const rowC = new Array(headers.length).fill(0);
        for (let j = 0; j < headers.length; j++) {
            let zj = 0;
            for (let i = 0; i < numConstraints; i++) {
                const basisIdx = basicVarIndices[i];
                const c_basis = getCost(basisIdx);
                zj += c_basis * matrix[i][j];
            }
            const cj = getCost(j);
            rowC[j] = zj - cj;
        }
        return rowC;
    };
    
    let currentRow0 = calculateZRow();
    
    const calculateCurrentZ = (): number => {
        let z = 0;
        for(let i=0; i<numConstraints; i++) {
            const basisIdx = basicVarIndices[i];
            const c_basis = getCost(basisIdx);
            z += c_basis * rhs[i];
        }
        return z;
    };
    
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

    const buildTableauState = (
        desc: string, 
        pivotRow?: number, 
        pivotCol?: number,
        ratios?: (number | null)[],
        status: SolverStatus = 'IN_PROGRESS',
        isOptimal: boolean = false
    ): SolverStep => {
        const tableauRows: TableauRow[] = matrix.map((row, i) => ({
            basicVar: colToVarName[basicVarIndices[i]],
            coefficients: [...row],
            rhs: rhs[i],
            ratio: ratios ? ratios[i] : null
        }));

        const currentZ = calculateCurrentZ();
        
        // Case (7): Alternate Solutions check
        // If optimal, check if any non-basic variable has 0 in Z-row
        if (isOptimal && status === 'OPTIMAL') {
            const hasAlternative = currentRow0.some((val, idx) => {
                const isBasic = basicVarIndices.includes(idx);
                const isArtificial = colToVarName[idx].startsWith('a');
                // Non-basic, Non-artificial, with 0 reduced cost implies alternate optima
                return !isBasic && !isArtificial && Math.abs(val) < 1e-5;
            });
            if (hasAlternative) {
                status = 'ALTERNATIVE_SOLUTION';
                desc += " Note: Zero reduced cost for a non-basic variable indicates Alternate (Multiple) Solutions exist.";
            }
        }
        
        // Case (6): Unbounded Solution Space check logic is implicit.
        // If Simplex terminates optimally, solution is bounded even if space is unbounded in other directions.
        // If Simplex fails to terminate (pivot col all <= 0), it's Unbounded Solution.

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
            zValue: isMinimization ? -currentZ : currentZ, // Flip back for Min problems
            standardFormEquations: steps.length === 0 ? standardFormEquations : undefined
        };
    };

    // --- ITERATION LOOP ---
    const MAX_ITERATIONS = 20;
    let iteration = 0;

    // Step 1: Standard Form & Initial Tableau
    const hasArtificials = colToVarName.some(n => n.startsWith('a'));
    let initialDesc = "Converted problem to Standard Form. ";
    if (initialNormalizationLogs.length > 0) initialDesc += "Normalized negative RHS. ";
    
    const addedTypes = [];
    if (colToVarName.some(n => n.startsWith('s'))) addedTypes.push("Slack Variables");
    if (colToVarName.some(n => n.startsWith('e'))) addedTypes.push("Surplus Variables");
    if (colToVarName.some(n => n.startsWith('a'))) addedTypes.push("Artificial Variables");
    initialDesc += `Added ${addedTypes.join(", ")}. `;
    
    if (hasArtificials) initialDesc += `Using Big-M method (M=${M}) to penalize artificial variables.`;
    
    steps.push(buildTableauState(initialDesc));

    while (iteration < MAX_ITERATIONS) {
        iteration++;
        
        // 1. Check Optimality (Most negative Zj-Cj for Maximization of augmented problem)
        let minVal = 0;
        let pivotCol = -1;
        
        for (let j = 0; j < headers.length; j++) {
            // Looking for most negative value
            if (currentRow0[j] < minVal - 1e-9) { 
                minVal = currentRow0[j];
                pivotCol = j;
            }
        }

        // OPTIMALITY REACHED
        if (pivotCol === -1) {
            // Case (3): Infeasible Solution
            // Check if any Artificial Variable is in the basis with a positive value
            const artificialInBasis = basicVarIndices.some((idx, i) => {
                const name = colToVarName[idx];
                return name.startsWith('a') && rhs[i] > 1e-5;
            });

            if (artificialInBasis) {
                const finalStep = buildTableauState(
                    "Optimality conditions satisfied, but an Artificial Variable remains positive in the basis. This indicates NO FEASIBLE SOLUTION.", 
                    undefined, undefined, undefined, 'INFEASIBLE', false
                );
                steps.push(finalStep);
                return steps;
            }

            const finalStep = buildTableauState(
                "All (Zj - Cj) >= 0. Optimality Reached.", 
                undefined, undefined, undefined, 'OPTIMAL', true
            );
            steps.push(finalStep);
            return steps;
        }

        // 2. Ratio Test
        let minRatio = Infinity;
        let pivotRow = -1;
        const ratios: (number | null)[] = [];
        const ties: number[] = []; // To track Case (4) Degeneracy

        for (let i = 0; i < numConstraints; i++) {
            const val = matrix[i][pivotCol];
            if (val > 1e-9) { 
                const ratio = rhs[i] / val;
                ratios.push(ratio);
                
                if (Math.abs(ratio - minRatio) < 1e-9) {
                    // Tie detected
                    ties.push(i);
                } else if (ratio < minRatio) {
                    minRatio = ratio;
                    pivotRow = i;
                    ties.length = 0; // Clear previous ties
                    ties.push(i);
                }
            } else {
                ratios.push(null);
            }
        }

        // Case (5): Unbounded Solution
        if (pivotRow === -1) {
            const unboundStep = buildTableauState(
                `Entering variable ${colToVarName[pivotCol]} can increase indefinitely because all constraint coefficients in this column are non-positive. UNBOUNDED SOLUTION.`, 
                undefined, pivotCol, ratios, 'UNBOUNDED', false
            );
            steps.push(unboundStep);
            return steps;
        }

        // Case (4): Degeneracy
        let stepDesc = `Pivot: Enter ${colToVarName[pivotCol]} (Most Negative Cost), Leave ${colToVarName[basicVarIndices[pivotRow]]} (Min Ratio).`;
        if (ties.length > 1) {
            stepDesc += " [DEGENERACY DETECTED] Tie in minimum ratio. Arbitrarily selected first candidate to break tie.";
        } else if (rhs[pivotRow] < 1e-9) {
            stepDesc += " [DEGENERACY DETECTED] Pivot row RHS is 0.";
        }

        // 3. Record Pre-Pivot Step
        steps.push(buildTableauState(
            stepDesc, 
            pivotRow, 
            pivotCol, 
            ratios
        ));

        // 4. Pivot Operation
        const pivotVal = matrix[pivotRow][pivotCol];
        for (let j = 0; j < matrix[pivotRow].length; j++) matrix[pivotRow][j] /= pivotVal;
        rhs[pivotRow] /= pivotVal;
        
        basicVarIndices[pivotRow] = pivotCol;
        
        for (let i = 0; i < numConstraints; i++) {
            if (i !== pivotRow) {
                const factor = matrix[i][pivotCol];
                for (let j = 0; j < matrix[i].length; j++) matrix[i][j] -= factor * matrix[pivotRow][j];
                rhs[i] -= factor * rhs[pivotRow];
            }
        }
        
        currentRow0 = calculateZRow();
    }
    
    steps.push(buildTableauState("Maximum iterations reached.", undefined, undefined, undefined, 'IN_PROGRESS', false));
    return steps;
  }
}