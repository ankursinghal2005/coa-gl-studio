
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { mainNavItems, footerNavItems, type NavItemConfig } from '@/config/nav.tsx';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile'; // Assuming this hook exists

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const NavContent = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className={cn(
      "flex h-full flex-col",
      !inSheet && "bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
    )}>
      <div className="px-4 py-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2" onClick={() => inSheet && setIsOpen(false)}>
          <span className="text-xl font-bold bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center rounded">F</span>
          <div>
            <span className="font-semibold text-lg text-primary">Financial</span>
            <span className="text-xs block text-muted-foreground">by OpenGov</span>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="flex flex-col space-y-1">
          {mainNavItems.map((item, index) =>
            item.children && item.children.length > 0 ? (
              <Accordion type="multiple" className="w-full" key={`${item.title}-main-${index}`}>
                <AccordionItem value={item.title} className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180 rounded-md hover:bg-accent hover:text-accent-foreground px-2">
                    <span className="flex items-center">
                      {item.icon && <span className="mr-2 w-5 h-5">{item.icon}</span>}
                      {item.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pl-5">
                    <div className="flex flex-col space-y-1 mt-1">
                      {item.children.map((child, childIndex) => (
                        <NavItemLink
                          key={`${child.title}-child-${childIndex}`}
                          item={child}
                          onClose={() => inSheet && setIsOpen(false)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : item.href ? (
              <NavItemLink
                key={`${item.title}-main-link-${index}`}
                item={item}
                onClose={() => inSheet && setIsOpen(false)}
              />
            ) : (
               <span key={`${item.title}-main-span-${index}`} className="flex w-full cursor-not-allowed items-center rounded-md p-2 text-sm text-muted-foreground">
                 {item.title}
               </span>
            )
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto p-3 border-t border-sidebar-border space-y-1">
        {footerNavItems.map((item, index) => (
           <NavItemLink
              key={`${item.title}-footer-${index}`}
              item={item}
              onClose={() => inSheet && setIsOpen(false)}
            />
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pl-0 pr-0 pt-0 w-72 sm:w-80 data-[state=open]:bg-sidebar">
           {/* SheetHeader and SheetTitle removed as per previous fix, title now in NavContent if needed or sr-only */}
          <NavContent inSheet={true} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view: always visible sidebar
  return (
    <aside className={cn("h-screen w-64 hidden md:block", className)}>
      <NavContent />
    </aside>
  );
}

interface NavItemLinkProps {
  item: NavItemConfig;
  onClose?: () => void;
}

function NavItemLink({ item, onClose }: NavItemLinkProps) {
  const pathname = usePathname();
  if (!item.href && !item.children) {
     return (
       <span className={cn(
         "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium",
         item.disabled ? "cursor-not-allowed opacity-60 text-muted-foreground" : "text-sidebar-foreground/80"
         )}
       >
         {item.icon && <span className="mr-2 w-5 h-5">{item.icon}</span>}
         {item.title}
       </span>
     );
  }

  return (
    <Link
      href={item.href || '#'}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-sidebar-foreground/80 hover:text-accent-foreground',
        item.disabled && 'cursor-not-allowed opacity-60'
      )}
      onClick={() => {
        if (onClose) onClose();
      }}
      aria-disabled={item.disabled}
      tabIndex={item.disabled ? -1 : undefined}
    >
      {item.icon && <span className="mr-2 w-5 h-5">{item.icon}</span>}
      {item.title}
      {item.label && <span className="ml-auto text-muted-foreground">{item.label}</span>}
    </Link>
  );
}
