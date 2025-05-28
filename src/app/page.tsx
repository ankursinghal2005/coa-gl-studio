import { ConfigurationBlock } from '@/components/ConfigurationBlock';
import { LayoutGrid, Code2, Network, Shuffle, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

const configItems = [
  { 
    id: 'segments', 
    title: 'Segments', 
    icon: LayoutGrid, 
    description: 'Define your chart of accounts structure.',
    dataAiHint: 'chart structure' 
  },
  { 
    id: 'segment-codes', 
    title: 'Segment Codes', 
    icon: Code2, 
    description: 'Manage codes for each segment.',
    dataAiHint: 'code list'
  },
  { 
    id: 'hierarchies', 
    title: 'Hierarchies', 
    icon: Network,
    description: 'Organize segment codes into hierarchies.',
    dataAiHint: 'organization chart'
  },
  { 
    id: 'combination-rules', 
    title: 'Combination Rules', 
    icon: Shuffle, 
    description: 'Set up rules for valid account combinations.',
    dataAiHint: 'rules logic'
  },
  { 
    id: 'account-access', 
    title: 'Account Access Control', 
    icon: ShieldCheck, 
    description: 'Control user access to accounts.',
    dataAiHint: 'security access'
  },
  { 
    id: 'settings', 
    title: 'Settings', 
    icon: SettingsIcon, 
    description: 'Configure application-wide settings.',
    dataAiHint: 'cogwheel gear'
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-4 py-8 sm:p-8 bg-background">
      <div className="w-full max-w-5xl">
        <header className="mb-10 sm:mb-16 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
            Opengov | General Ledger
          </h1>
          <div className="mt-2 text-center">
            <span className="text-md text-muted-foreground">
              COA Configuration
            </span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {configItems.map((item) => (
            <ConfigurationBlock
              key={item.id}
              icon={item.icon}
              title={item.title}
              description={item.description}
              href={`/configure/${item.id}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
