
import { QueuingInput, QueuingResult } from "../types";

export class QueuingEngine {
    
    /**
     * Solves Single Channel Infinite Population Model (M/M/1)
     * Assumptions: Poisson Arrival, Exponential Service Time, FCFS discipline.
     */
    public static solveMM1(input: QueuingInput): QueuingResult {
        const lambda = input.arrivalRate;
        const mu = input.serviceRate;

        // Stability Check
        if (lambda >= mu) {
            return {
                rho: lambda / mu,
                Lq: Infinity,
                Ls: Infinity,
                Wq: Infinity,
                Ws: Infinity,
                P0: 0,
                isStable: false
            };
        }

        // 1. Utilization Factor (Traffic Intensity)
        const rho = lambda / mu;

        // 2. Probability of zero units in system (Idle server)
        const P0 = 1 - rho;

        // 3. Average number of units in the system (Ls)
        const Ls = lambda / (mu - lambda);

        // 4. Average number of units in the queue (Lq)
        // Lq = Ls - rho  OR  rho^2 / (1-rho)
        const Lq = Ls - rho;

        // 5. Average waiting time in the system (Ws)
        // Little's Law: Ls = lambda * Ws => Ws = Ls / lambda = 1 / (mu - lambda)
        const Ws = 1 / (mu - lambda);

        // 6. Average waiting time in the queue (Wq)
        // Wq = Ws - (1/mu)  OR  rho / (mu - lambda)
        const Wq = Ws - (1 / mu);

        // 7. Probability Distribution Pn (Prob of exactly n customers)
        // Pn = (1 - rho) * rho^n
        const Pn: number[] = [];
        for(let n=0; n<=5; n++) {
            Pn.push((1 - rho) * Math.pow(rho, n));
        }

        return {
            rho,
            Lq,
            Ls,
            Wq,
            Ws,
            P0,
            Pn,
            isStable: true
        };
    }
}
