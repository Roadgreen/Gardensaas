import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsPageClient } from '@/components/garden/settings-page-client';

export const metadata: Metadata = {
  title: 'Billing & Settings',
  description: 'Manage your subscription and account settings.',
};

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageClient />
    </Suspense>
  );
}
