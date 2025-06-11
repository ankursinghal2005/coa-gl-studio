
'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function JournalEntriesPage() {
  const breadcrumbItems = [
    { label: 'General Ledger', href: '/' },
    { label: 'Work with Journal Entries' },
  ];

  return (
    <div className="w-full max-w-full mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Work with Journal Entries
        </h1>
      </header>
      {/* Page content will be added here later */}
    </div>
  );
}
