export enum OptimizationType {
  MAXIMIZE = 'MAXIMIZE',
  MINIMIZE = 'MINIMIZE'
}

export enum ConstraintSign {
  LESS_EQ = '<=',
  GREATER_EQ = '>=',
  EQ = '='
}

export interface Variable {
  id: string;
  coefficient: number;
}

export interface Constraint {
  id: string;
  coefficients: number[]; // Index corresponds to variable index
  sign: ConstraintSign;
  rhs: number; // Right hand side value
}

export interface LPProblem {
  type: OptimizationType;
  variables: string[]; // Names of variables (e.g., x1, x2)
  objectiveCoefficients: number[];
  constraints: Constraint[];
  nonNegative?: boolean; // Defaults to true. If false, variables are unrestricted (can be negative).
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  problem: LPProblem;
  method: SolverMethod;
}

export interface TableauRow {
  basicVar: string;
  basicVarCost: number; // Cb
  coefficients: number[];
  rhs: number;
  ratio?: number | null;
}

export type SolverStatus = 'IN_PROGRESS' | 'OPTIMAL' | 'UNBOUNDED' | 'INFEASIBLE' | 'ALTERNATIVE_SOLUTION';

export interface SolverStep {
  stepIndex: number;
  phase?: 1 | 2; // For Two-Phase method
  description: string;
  operations?: string[]; // Matrix operations performed to reach this step
  tableau: TableauRow[];
  headers: string[]; // Column headers (x1, x2, s1, a1, etc.)
  cjRow: number[]; // The original objective function coefficients (Top row)
  zjRow: number[]; // Zj row (Sum of Cb * aij)
  netEvaluationRow: number[]; // Cj - Zj row
  pivotRowIdx?: number;
  pivotColIdx?: number;
  enteringVar?: string;
  leavingVar?: string;
  isOptimal: boolean;
  status: SolverStatus;
  solution?: Record<string, number>;
  zValue?: number;
  standardFormEquations?: string[];
}

export enum SolverMethod {
  SIMPLEX = 'Simplex',
  BIG_M = 'Big M',
  TWO_PHASE = 'Two Phase'
}