
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
        href: '/', // Links to the current homepage
        icon: <ListTree className="h-4 w-4" />,
      },
      {
        title: 'Journal Entries',
        href: '/journal-entries',
        icon: <FilePenLine className="h-4 w-4" />,
        disabled: true,
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
    title: 'Reports', // Main reports section
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
    href: '/configure/settings', // Assuming this is the general settings page
  },
  {
    title: 'Help & Support',
    icon: <HelpCircle className="h-4 w-4" />,
    href: '/help-support',
    disabled: true,
  },
];

