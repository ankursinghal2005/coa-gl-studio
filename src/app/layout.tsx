
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { SegmentsProvider } from '@/contexts/SegmentsContext';
import { HierarchiesProvider } from '@/contexts/HierarchiesContext';
import { CombinationRulesProvider } from '@/contexts/CombinationRulesContext';
import { AccountAccessControlProvider } from '@/contexts/AccountAccessControlContext';
import { SidebarNav } from '@/components/layout/SidebarNav'; // New import

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
                       <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                         <div className="w-full flex-1 md:w-auto md:flex-none">
                           {/* Future: Add a command menu or search here if needed */}
                         </div>
                         <nav className="flex items-center">
                           <span className="font-semibold text-primary">Opengov Financials</span>
                           {/* Future: Add theme toggle or user profile icon here */}
                         </nav>
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
