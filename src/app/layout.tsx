import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans', // Use a generic variable name for Tailwind
  weight: ['400', '500', '700'], // Include desired weights
});

export const metadata: Metadata = {
  title: 'Opengov | General Ledger',
  description: 'Configuration portal for Opengov General Ledger',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        dmSans.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
