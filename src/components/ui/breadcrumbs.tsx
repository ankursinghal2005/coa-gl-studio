
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentProps, ReactNode } from 'react';

interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}

interface BreadcrumbsProps extends ComponentProps<'nav'> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

export function Breadcrumbs({ items, separator, className, ...props }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const defaultSeparator = <ChevronRight className="h-4 w-4" />;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4 text-sm", className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground break-words">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center gap-1.5">
            {index > 0 && (separator || defaultSeparator)}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
