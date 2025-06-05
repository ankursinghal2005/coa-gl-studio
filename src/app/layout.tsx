
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { SegmentsProvider } from '@/contexts/SegmentsContext';
import { HierarchiesProvider } from '@/contexts/HierarchiesContext';
import { CombinationRulesProvider } from '@/contexts/CombinationRulesContext';
import { AccountAccessControlProvider } from '@/contexts/AccountAccessControlContext';
import { SidebarNav } from '@/components/layout/SidebarNav';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans', 
  weight: ['400', '500', '700'], 
});

export const metadata: Metadata = {
  title: 'Opengov Financials | COA Configuration',
  description: 'Chart of Accounts (COA) Configuration for the General Ledger module of Opengov Financials.',
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
        <SegmentsProvider>
          <HierarchiesProvider>
            <CombinationRulesProvider>
              <AccountAccessControlProvider>
                <div className="relative flex min-h-screen flex-col">
                  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-14 max-w-screen-2xl items-center">
                      <SidebarNav />
                       <div className="flex flex-1 items-center justify-center">
                         <span className="text-xl font-bold text-primary">Opengov Financials</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         {/* Future: Add theme toggle or user profile icon here */}
                       </div>
                    </div>
                  </header>
                  <main className="flex-1">{children}</main>
                </div>
              </AccountAccessControlProvider>
            </CombinationRulesProvider>
          </HierarchiesProvider>
        </SegmentsProvider>
        <Toaster />
      </body>
    </html>
  );
}
