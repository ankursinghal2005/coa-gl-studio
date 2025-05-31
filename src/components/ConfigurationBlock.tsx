
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnchorHTMLAttributes } from 'react';

interface ConfigurationBlockProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string; // Explicitly part of props, though also in AnchorHTMLAttributes
}

export function ConfigurationBlock({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  className, // Destructure className to merge it correctly
  ...rest // Spread other props like data-ai-hint
}: ConfigurationBlockProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <a
        className={cn(
          "block group rounded-lg overflow-hidden h-full border border-border shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl",
          className
        )}
        {...rest}
      >
        <div className={cn(
          "p-6 flex flex-col items-center text-center h-full transition-colors duration-300 ease-in-out",
          "bg-card group-hover:bg-primary"
        )}>
          <Icon className={cn(
            "w-10 h-10 mb-4 transition-colors duration-300 ease-in-out",
            "text-primary group-hover:text-primary-foreground"
            )} aria-hidden="true" />
          <h3 className={cn(
            "text-xl font-semibold mb-2 transition-colors duration-300 ease-in-out",
            "text-primary group-hover:text-primary-foreground"
            )}>{title}</h3>
          <p className={cn(
            "text-sm transition-colors duration-300 ease-in-out",
            "text-muted-foreground group-hover:text-primary-foreground group-hover:opacity-90"
            )}>{description}</p>
        </div>
      </a>
    </Link>
  );
}
