
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem, // Ensure this is imported
  SidebarTrigger, 
  useSidebar,
} from '@/components/ui/sidebar';
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
import { SheetTitle } from '@/components/ui/sheet'; // For accessibility

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { state: sidebarState, isMobile } = useSidebar(); 
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
                  <AccordionTrigger asChild>
                     <SidebarMenuButton disabled={item.disabled} className="w-full justify-between pr-2 group-data-[collapsible=icon]:justify-center">
                        <span className="flex items-center">
                          {item.icon && <span className="mr-2 w-5 h-5 flex items-center justify-center">{item.icon}</span>}
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </span>
                      </SidebarMenuButton>
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
    // For mobile, we use the Sheet component from ui/sidebar
    return (
      <>
        {/* This SheetTitle is important for accessibility for Radix UI Dialog (which Sheet uses) */}
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
         <div className="flex items-center gap-2 px-2 py-2">
            <SidebarTrigger className="hidden md:flex data-[state=collapsed]:hidden mr-1" /> 
            <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center rounded">F</span>
                <div className="group-data-[collapsible=icon]:hidden">
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
    </Sidebar>
  );
}
