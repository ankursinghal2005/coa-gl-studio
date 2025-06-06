
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
  SidebarMenuSubItem,
  SidebarTrigger, 
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
  DropdownMenuSub as RadixDropdownMenuSub, 
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';


interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { state: sidebarState, toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();

  const renderNavItems = (items: NavItemConfig[], isSubmenu: boolean = false): React.ReactNode[] => {
    return items.map((item, index) => {
      // Only create iconSpan if it's not a submenu and the item has an icon
      const iconSpan = !isSubmenu && item.icon ? <span className="flex items-center justify-center shrink-0">{item.icon}</span> : null;
      const childIconSpan = (childItem: NavItemConfig) => childItem.icon && !isSubmenu ? <span className="mr-2 flex items-center justify-center shrink-0">{childItem.icon}</span> : null;


      if (!item.href && !item.children) {
        if (isSubmenu && sidebarState === 'collapsed' && !isMobile) { 
          return <DropdownMenuItem key={`${item.title}-${index}-label`} disabled className="font-semibold opacity-100 cursor-default">{/* Icon removed for subitems */}{item.title}</DropdownMenuItem>;
        }
        return (
          <SidebarMenuItem key={`${item.title}-${index}-label`} className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
            {iconSpan} {/* Remains for top-level if applicable, but this path is for non-link, non-children items */}
            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
          </SidebarMenuItem>
        );
      }

      if (item.children && item.children.length > 0) {
        if (sidebarState === 'collapsed' && !isMobile) {
          const hasGrandChildren = item.children.some(child => child.children && child.children.length > 0);

          if (hasGrandChildren && !isSubmenu) { 
             return (
              <SidebarMenuItem key={`${item.title}-${index}-main-dd-sub`}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} aria-label={item.title} disabled={item.disabled} className="w-full">
                      {iconSpan}
                      <span className="sr-only">{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="ml-1 w-56">
                     {item.children.map((child, childIndex) => {
                        // const grandChildIconSpanRender = (grandChildItem: NavItemConfig) => grandChildItem.icon ? <span className="mr-2 flex items-center justify-center shrink-0">{grandChildItem.icon}</span> : null;
                        if (child.children && child.children.length > 0) {
                           return (
                            <RadixDropdownMenuSub key={`${child.title}-${childIndex}-dd-sub`}>
                              <DropdownMenuSubTrigger disabled={child.disabled}>
                                {/* Icon removed for subitems */}
                                <span>{child.title}</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {child.children.map((grandChild, grandChildIndex) => {
                                  return (
                                    <DropdownMenuItem key={`${grandChild.title}-${grandChildIndex}-dd-grandchild`} asChild disabled={grandChild.disabled}>
                                      <Link href={grandChild.href || '#'} className={cn("flex items-center", grandChild.disabled && "pointer-events-none opacity-60")}>
                                        {/* Icon removed for subitems */}
                                        {grandChild.title}
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuSubContent>
                            </RadixDropdownMenuSub>
                           );
                        }
                        return (
                          <DropdownMenuItem key={`${child.title}-${childIndex}-dd-child`} asChild disabled={child.disabled}>
                            <Link href={child.href || '#'} className={cn("flex items-center", child.disabled && "pointer-events-none opacity-60")}>
                              {/* Icon removed for subitems */}
                              {child.title}
                            </Link>
                          </DropdownMenuItem>
                        );
                     })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }
          // Collapsed, no grandchildren or isSubmenu (but isSubmenu shouldn't hit this specific collapsed path directly)
          return (
            <SidebarMenuItem key={`${item.title}-${index}-dd`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} aria-label={item.title} disabled={item.disabled} className="w-full">
                    {iconSpan} {/* Top-level icon */}
                    <span className="sr-only">{item.title}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="ml-1 w-56">
                  <DropdownMenuItem className="font-semibold mb-1 cursor-default focus:bg-transparent flex items-center gap-2">
                    {iconSpan} {/* Top-level icon in dropdown header */}
                    {item.title}
                  </DropdownMenuItem>
                  {item.children.map((child, childIndex) => {
                    return (
                      <DropdownMenuItem key={`${child.title}-${childIndex}-dd-child`} asChild disabled={child.disabled}>
                        <Link href={child.href || '#'} className={cn("flex items-center", child.disabled && "pointer-events-none opacity-60")}>
                          {/* Icon removed for subitems */}
                          {child.title}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        } else { // Expanded or mobile view
          return (
            <SidebarMenuItem key={`${item.title}-${index}-acc`} className="p-0">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value={item.title} className="border-b-0">
                  <AccordionTrigger
                    disabled={item.disabled}
                    className={cn(
                      sidebarMenuButtonVariants({variant: "default", size: "default"}),
                      "!hover:no-underline !py-2 !px-2 !h-8",
                      "justify-between group-data-[collapsible=icon]:justify-center"
                    )}
                  >
                     <span className="flex items-center gap-2">
                        {iconSpan} {/* Top-level icon */}
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub>
                      {renderNavItems(item.children, true)} {/* Pass isSubmenu = true */}
                    </SidebarMenuSub>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SidebarMenuItem>
          );
        }
      } else { // Direct link item (leaf node)
        if (isSubmenu) {
          return (
            <SidebarMenuSubItem key={`${item.title}-${index}-sublink`}>
              {/* <Link href={item.href || '#'} legacyBehavior passHref> */}
                <SidebarMenuSubButton
                  isActive={pathname === item.href}
                  disabled={item.disabled}
                  aria-disabled={item.disabled}
                  tabIndex={item.disabled ? -1 : undefined}
                  className="block w-full" 
                  asChild
                >
                  <Link href={item.href || '#'} className="block w-full">
                    {/* Icon removed for subitems */}
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              {/* </Link> */}
            </SidebarMenuSubItem>
          );
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
                  {iconSpan} {/* Top-level icon */}
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        }
      }
    });
  };

  if (isMobile) {
    return (
      <>
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

  // Desktop sidebar structure
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className={cn("hidden md:flex", className)}
      side="left"
    >
      <SidebarHeader className="p-2 border-b border-sidebar-border flex flex-col items-center">
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 w-full h-auto py-2 px-2",
            sidebarState === 'collapsed' ? "justify-center" : "justify-start",
            "hover:bg-sidebar-accent" 
          )}
          onClick={toggleSidebar}
          aria-label={sidebarState === 'collapsed' ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarState === 'collapsed' ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-xl font-bold bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center rounded shrink-0">
            F
          </span>
          <div className="group-data-[collapsible=icon]:hidden text-left">
            <span className="font-semibold text-lg text-primary">Financial</span>
            <span className="text-xs block text-muted-foreground">by OpenGov</span>
          </div>
        </Button>
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
