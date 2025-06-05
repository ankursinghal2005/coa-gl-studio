
import { ConfigurationBlock } from '@/components/ConfigurationBlock';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LayoutGrid, Code2, Network, Shuffle, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

const configItems = [
  {
    id: 'segments',
    title: 'Segments',
    icon: LayoutGrid,
    description: 'Define your chart of accounts structure.',
    dataAiHint: 'chart structure',
    href: '/configure/segments',
  },
  {
    id: 'segment-codes',
    title: 'Segment Codes',
    icon: Code2,
    description: 'Manage codes for each segment.',
    dataAiHint: 'code list',
    href: '/configure/segment-codes',
  },
  {
    id: 'hierarchies',
    title: 'Hierarchies',
    icon: Network,
    description: 'Organize segment codes into hierarchies.',
    dataAiHint: 'organization chart',
    href: '/configure/hierarchies',
  },
  {
    id: 'combination-rules',
    title: 'Combination Rules',
    icon: Shuffle,
    description: 'Set up rules for valid account combinations.',
    dataAiHint: 'rules logic',
    href: '/configure/combination-rules',
  },
  {
    id: 'account-access-control',
    title: 'Account Access Control',
    icon: ShieldCheck,
    description: 'Control user access to accounts.',
    dataAiHint: 'security access',
    href: '/configure/account-access-control',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: SettingsIcon,
    description: 'Configure application-wide settings.',
    dataAiHint: 'cogwheel gear',
    href: '/configure/settings',
  },
];

export default function HomePage() {
  const breadcrumbItems = [{ label: 'COA Configuration' }];

  return (
    // Removed min-h-screen, p-4/py-8, bg-background. Added w-full, max-w-5xl, mx-auto.
    <div className="w-full max-w-5xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-10 sm:mb-16 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
            Chart of Accounts Configuration
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">
            For the General Ledger Module of Opengov Financials
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {configItems.map((item) => (
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
