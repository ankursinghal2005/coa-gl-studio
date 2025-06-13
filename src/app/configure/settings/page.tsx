
'use client';

import { ConfigurationBlock } from '@/components/ConfigurationBlock';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CalendarDays, Settings as SettingsIcon } from 'lucide-react'; // Added CalendarDays

const settingsItems = [
  {
    id: 'fiscal-periods',
    title: 'Fiscal Period Management',
    icon: CalendarDays,
    description: 'Define and manage fiscal years and periods.',
    dataAiHint: 'calendar schedule',
    href: '/configure/settings/fiscal-periods', // Placeholder for now
  },
  // Add more settings cards here in the future
];

export default function SettingsPage() {
  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' }, 
    { label: 'Settings' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-10 sm:mb-16 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary flex items-center justify-center">
            <SettingsIcon className="w-8 h-8 sm:w-10 sm:h-10 mr-3" />
            Application Settings
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">
            Configure global settings for your financial application.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {settingsItems.map((item) => (
            <ConfigurationBlock
              key={item.id}
              icon={item.icon}
              title={item.title}
              description={item.description}
              href={item.href}
              data-ai-hint={item.dataAiHint}
            />
          ))}
        </div>
    </div>
  );
}
