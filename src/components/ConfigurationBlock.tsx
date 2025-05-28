import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurationBlockProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

export function ConfigurationBlock({ icon: Icon, title, description, href }: ConfigurationBlockProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <a className="block group rounded-lg shadow-lg overflow-hidden h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <div className={cn(
          "p-6 transition-all duration-300 ease-in-out",
          "bg-primary text-primary-foreground hover:bg-accent hover:shadow-xl hover:-translate-y-1",
          "flex flex-col items-center text-center h-full" 
        )}>
          <Icon className="w-10 h-10 mb-4" aria-hidden="true" />
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </a>
    </Link>
  );
}
