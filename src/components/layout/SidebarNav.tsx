
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { mainNavItems, footerNavItems, type NavItemConfig } from '@/config/nav.tsx';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem, // Ensure this is imported
  SidebarTrigger, 
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button'; // Import Button
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { SheetTitle } from '@/components/ui/sheet'; 

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { state: sidebarState, toggleSidebar, isMobile } = useSidebar(); 
  const pathname = usePathname();

  const renderNavItems = (items: NavItemConfig[], isSubmenu: boolean = false) => {
    return items.map((item, index) => {
      if (!item.href && !item.children) {
        if (isSubmenu) { 
          return <DropdownMenuItem key={`${item.title}-${index}-label`} disabled className="font-semibold opacity-100 cursor-default">{item.title}</DropdownMenuItem>;
        }
        return (
          <SidebarMenuItem key={`${item.title}-${index}-span`} className="px-2 py-1.5 text-sm text-muted-foreground">
            {item.icon && <span className="mr-2 w-5 h-5 inline-flex items-center justify-center">{item.icon}</span>}
            {item.title}
          </SidebarMenuItem>
        );
      }

      if (item.children && item.children.length > 0) {
        if (sidebarState === 'collapsed' && !isMobile) {
          return (
            <SidebarMenuItem key={`${item.title}-${index}-dd`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    aria-label={item.title}
                    disabled={item.disabled}
                    className="w-full"
                  >
                    {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
                    <span className="sr-only">{item.title}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="ml-1 w-56">
                  <DropdownMenuItem className="font-semibold mb-1 cursor-default focus:bg-transparent">
                    {item.icon && <span className="mr-2 w-5 h-5">{item.icon}</span>}
                    {item.title}
                  </DropdownMenuItem>
                  {item.children.map((child, childIndex) => (
                    <DropdownMenuItem key={`${child.title}-${childIndex}-dd-child`} asChild disabled={child.disabled}>
                      <Link href={child.href || '#'} className={cn(child.disabled && "pointer-events-none opacity-60")}>
                        {child.icon && <span className="mr-2 w-5 h-5">{child.icon}</span>}
                        {child.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        } else {
          return (
            <SidebarMenuItem key={`${item.title}-${index}-acc`} className="p-0">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value={item.title} className="border-b-0">
                  <AccordionTrigger
                    disabled={item.disabled}
                    className={cn(
                      sidebarMenuButtonVariants({variant: "default", size: "default"}), // Use variants
                      // Override AccordionTrigger's default hover:underline and py-4
                      "!hover:no-underline !py-2 !px-2 !h-8", 
                      // Ensure justify-between is still applied so the internal chevron goes to the right
                      "justify-between group-data-[collapsible=icon]:justify-center"
                    )}
                  >
                     <span className="flex items-center gap-2">
                        {item.icon && <span className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</span>}
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub>
                      {item.children.map((child, childIndex) => (
                        <SidebarMenuSubItem key={`${child.title}-${childIndex}-acc-child`}>
                          <Link href={child.href || '#'} legacyBehavior passHref>
                            <SidebarMenuSubButton
                              isActive={pathname === child.href}
                              disabled={child.disabled}
                              aria-disabled={child.disabled}
                              tabIndex={child.disabled ? -1 : undefined}
                            >
                              {child.icon && <span className="mr-2 w-5 h-5 flex items-center justify-center">{child.icon}</span>}
                              {child.title}
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SidebarMenuItem>
          );
        }
      } else {
        return (
          <SidebarMenuItem key={`${item.title}-${index}-link`}>
            <Link href={item.href || '#'} legacyBehavior passHref>
              <SidebarMenuButton
                tooltip={item.title}
                aria-label={item.title}
                isActive={pathname === item.href}
                disabled={item.disabled}
                className="w-full"
              >
                {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      }
    });
  };

  if (isMobile) {
    return (
      <>
        {/* Screen reader title for the sheet */}
        <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
        <SidebarHeader className="p-2 border-b border-sidebar-border">
           <div className="flex items-center gap-2 px-2 py-2">
              <Link href="/" className="flex items-center gap-2">
                  <span className="text-xl font-bold bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center rounded">F</span>
                  <div>
                      <span className="font-semibold text-lg text-primary">Financial</span>
                      <span className="text-xs block text-muted-foreground">by OpenGov</span>
                  </div>
              </Link>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
           <ScrollArea className="h-full"> 
              <SidebarMenu className="p-2"> 
                {renderNavItems(mainNavItems)}
              </SidebarMenu>
           </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
            {renderNavItems(footerNavItems)}
          </SidebarMenu>
        </SidebarFooter>
      </>
    );
  }


  return (
    <Sidebar
      variant="sidebar" 
      collapsible="icon" 
      className={cn("hidden md:flex", className)} 
      side="left"
    >
      <SidebarHeader className="p-2 border-b border-sidebar-border">
         <div className="flex items-center justify-between w-full px-1"> {/* Adjusted for spacing */}
            {/* Logo Area: Button when collapsed, Link when expanded */}
            {sidebarState === 'collapsed' && !isMobile ? (
              <Button
                variant="ghost"
                size="icon" 
                className="h-9 w-9 p-0 flex items-center justify-center rounded hover:bg-sidebar-accent"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                title="Expand sidebar" 
              >
                <span className="text-lg font-bold bg-primary text-primary-foreground h-7 w-7 flex items-center justify-center rounded">F</span>
              </Button>
            ) : (
              <Link href="/" className="flex items-center gap-2 ml-1"> {/* ml-1 for slight spacing if no trigger */}
                  <span className="text-xl font-bold bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center rounded">F</span>
                  <div className="group-data-[collapsible=icon]:hidden">
                      <span className="font-semibold text-lg text-primary">Financial</span>
                      <span className="text-xs block text-muted-foreground">by OpenGov</span>
                  </div>
              </Link>
            )}
            {/* Trigger to collapse (only shown when expanded on desktop) */}
            <SidebarTrigger className="hidden md:flex data-[state=expanded]:flex data-[state=collapsed]:hidden" /> 
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0"> 
         <ScrollArea className="h-full"> 
            <SidebarMenu className="p-2"> 
              {renderNavItems(mainNavItems)}
            </SidebarMenu>
         </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          {renderNavItems(footerNavItems)}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

