import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid TypeScript error about missing 'cwd' property
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // This solves the "white screen" issue by replacing process.env.API_KEY
    // in your code with the actual value from Vercel's environment variables.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent other libraries from crashing if they check process.env
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
    }
  };
});