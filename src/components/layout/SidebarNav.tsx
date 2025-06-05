
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { mainNavItems, type NavItemConfig } from '@/config/nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function SidebarNav() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Hamburger button for mobile */}
      <Button
        variant="ghost"
        className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </Button>
      {/* Sheet component for the navigation panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {/* Hamburger button for desktop (if needed, or remove if only mobile hamburger) */}
          <Button
            variant="ghost"
            className="hidden px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:flex" /* Changed md:block to md:flex to ensure it's displayed */
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pl-1 pr-0 pt-8 w-72 sm:w-80">
          <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
            <div className="flex flex-col space-y-2"> {/* Changed space-y-3 to space-y-2 for tighter packing */}
              {mainNavItems.map((item, index) =>
                item.children && item.children.length > 0 ? (
                  <Accordion type="multiple" className="w-full" key={item.title + index}>
                    <AccordionItem value={item.title} className="border-b-0">
                      <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180">
                        <span className="flex items-center">
                          {item.icon && <span className="mr-2 w-5 h-5">{item.icon}</span>}
                          {item.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 pl-4">
                        <div className="flex flex-col space-y-1 mt-1"> {/* Reduced space-y-2 to space-y-1 */}
                          {item.children.map((child, childIndex) => (
                            <NavItemLink
                              key={child.title + childIndex}
                              item={child}
                              onClose={() => setIsOpen(false)}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : item.href ? (
                  <NavItemLink
                    key={item.title + index}
                    item={item}
                    onClose={() => setIsOpen(false)}
                  />
                ) : (
                   <span key={item.title + index} className="flex w-full cursor-not-allowed items-center rounded-md p-2 text-sm text-muted-foreground hover:underline">
                     {item.title}
                   </span>
                )
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface NavItemLinkProps {
  item: NavItemConfig;
  onClose?: () => void; // Make onClose optional as not all NavItemLinks will need it
}

function NavItemLink({ item, onClose }: NavItemLinkProps) {
  const pathname = usePathname();
  if (!item.href && !item.children) { // If no href and no children, render as plain text
     return (
       <span className={cn(
         "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium",
         item.disabled ? "cursor-not-allowed opacity-80 text-muted-foreground" : "text-foreground/70"
         )}
       >
         {item.icon && <span className="w-5 h-5">{item.icon}</span>}
         {item.title}
       </span>
     );
  }

  return (
    <Link
      href={item.href || '#'} // Provide a fallback href if none, though logic above should prevent this
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-foreground/70',
        item.disabled && 'cursor-not-allowed opacity-80'
      )}
      onClick={() => {
        if (onClose) onClose();
      }}
      aria-disabled={item.disabled}
      tabIndex={item.disabled ? -1 : undefined}
    >
      {item.icon && <span className="w-5 h-5">{item.icon}</span>}
      {item.title}
      {item.label && <span className="ml-auto text-muted-foreground">{item.label}</span>}
    </Link>
  );
}

