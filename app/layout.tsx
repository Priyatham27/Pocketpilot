import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthGate } from '@/components/auth-gate';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PocketPilot - Personal Finance Tracker',
  description: 'Modern personal finance application to manage income, expenses, debts, loans, and savings goals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGate>{children}</AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
