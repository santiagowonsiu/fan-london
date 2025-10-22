'use client';

import ItemsTable from '@/components/ItemsTable';

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  return (
    <div className="app-container">
      <ItemsTable />
    </div>
  );
}

