
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
import { Button } from '@/components/ui/button'; // Added for mobile trigger
import { Menu } from 'lucide-react'; // Added for mobile trigger

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
                <div className="relative flex min-h-screen flex-col md:flex-row">
                  {/* SidebarNav will render itself as fixed on desktop or provide a trigger for mobile */}
                  <SidebarNav />
                  
                  {/* Main content area */}
                  <div className="flex flex-1 flex-col">
                    {/* Mobile-only header for hamburger and title */}
                    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
                        {/* The SidebarNav component itself will render its SheetTrigger for mobile */}
                        {/* This space can be used for page titles or other controls on mobile header */}
                        <div className="flex-1">
                           {/* Example: Page title can go here, dynamically */}
                        </div>
                    </header>
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                      {children}
                    </main>
                  </div>
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
