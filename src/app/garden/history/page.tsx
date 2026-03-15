import type { Metadata } from 'next';
import { HistoryPageClient } from '@/components/garden/history-page-client';

export const metadata: Metadata = {
  title: 'Garden History - Year Over Year',
  description: 'View your garden history season by season. Track what you planted where for better crop rotation and planning.',
};

export default function HistoryPage() {
  return <HistoryPageClient />;
}
