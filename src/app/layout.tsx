
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
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'; 

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
                <SidebarProvider> 
                  <div className="relative flex min-h-screen flex-col md:flex-row group/sidebar-wrapper"> 
                    <SidebarNav />
                    
                    <main className="flex flex-1 flex-col peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow">
                      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                        <SidebarTrigger className="md:hidden" /> 
                        <div className="flex-1 text-center md:text-left">
                           {/* Removed fixed title here; handled by SidebarNav or individual pages */}
                        </div>
                      </header>
                      {/* Added overflow-y-auto and h-full to ensure this area scrolls if content is too tall */}
                      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto h-full">
                        {children}
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              </AccountAccessControlProvider>
            </CombinationRulesProvider>
          </HierarchiesProvider>
        </SegmentsProvider>
        <Toaster />
      </body>
    </html>
  );
}
