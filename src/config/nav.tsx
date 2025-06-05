
import { Settings } from 'lucide-react';
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
    title: "General Ledger",
    children: [
      {
        title: "COA Configuration",
        href: "/", // Links to the current homepage
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
  { title: "Bank Rec", href: "/bank-rec", disabled: true },
  { title: "Accounts Payable", href: "/accounts-payable", disabled: true },
  { title: "Cash Receipts", href: "/cash-receipts", disabled: true },
  { title: "Payroll", href: "/payroll", disabled: true },
];
