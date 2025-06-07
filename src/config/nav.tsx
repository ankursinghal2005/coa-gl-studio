
import {
  Settings,
  LayoutDashboard,
  BookOpen,
  ListTree,
  FilePenLine,
  BarChart3,
  CreditCard,
  Target,
  ShoppingCart,
  Landmark,
  ClipboardList,
  Users,
  HelpCircle,
  LayoutGrid, 
  Code2,      
  Network,    
  Shuffle,    
  ShieldCheck 
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItemConfig {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: ReactNode;
  label?: string;
  children?: NavItemConfig[];
}

export const mainNavItems: NavItemConfig[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    disabled: true,
  },
  {
    title: 'General Ledger',
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      {
        title: 'COA Configuration',
        icon: <ListTree className="h-4 w-4" />,
        children: [
          {
            title: 'Segments',
            href: '/configure/segments',
            icon: <LayoutGrid className="h-4 w-4" />,
          },
          {
            title: 'Segment Codes',
            href: '/configure/segment-codes',
            icon: <Code2 className="h-4 w-4" />,
          },
          {
            title: 'Hierarchies',
            href: '/configure/hierarchies',
            icon: <Network className="h-4 w-4" />,
          },
          {
            title: 'Combination Rules',
            href: '/configure/combination-rules',
            icon: <Shuffle className="h-4 w-4" />,
          },
          {
            title: 'Account Access Control',
            href: '/configure/account-access-control',
            icon: <ShieldCheck className="h-4 w-4" />,
          },
          {
            title: 'Settings', 
            href: '/configure/settings',
            icon: <Settings className="h-4 w-4" />, 
          },
        ],
      },
      {
        title: 'Journal Entries',
        href: '/journal-entries', // Enabled this link
        icon: <FilePenLine className="h-4 w-4" />,
        disabled: false, // Enabled
      },
      {
        title: 'Reports',
        href: '/gl-reports',
        icon: <BarChart3 className="h-4 w-4" />,
        disabled: true,
      },
    ],
  },
  {
    title: 'Accounts Payable',
    href: '/accounts-payable',
    icon: <CreditCard className="h-4 w-4" />,
    disabled: true,
  },
  {
    title: 'Budgeting & Planning',
    href: '/budgeting-planning',
    icon: <Target className="h-4 w-4" />,
    disabled: true,
  },
  {
    title: 'Procurement',
    href: '/procurement',
    icon: <ShoppingCart className="h-4 w-4" />,
    disabled: true,
  },
  {
    title: 'Bank Reconciliation',
    href: '/bank-reconciliation',
    icon: <Landmark className="h-4 w-4" />,
    disabled: true,
  },
  {
    title: 'Reports', 
    href: '/reports',
    icon: <ClipboardList className="h-4 w-4" />,
    disabled: true,
  },
  {
    title: 'Administration',
    href: '/administration',
    icon: <Users className="h-4 w-4" />,
    disabled: true,
  },
];

export const footerNavItems: NavItemConfig[] = [
  {
    title: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    href: '/configure/settings', 
  },
  {
    title: 'Help & Support',
    icon: <HelpCircle className="h-4 w-4" />,
    href: '/help-support',
    disabled: true,
  },
];
