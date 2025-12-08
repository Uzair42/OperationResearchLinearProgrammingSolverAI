import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'OperationResearch Solver AI',
  description: 'An intelligent Linear Programming solver that extracts problems from images, text, or manual input and provides step-by-step Simplex, Big M, and Two-Phase method visualizations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}