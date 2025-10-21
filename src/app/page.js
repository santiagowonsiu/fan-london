'use client';

import ItemsTable from '@/components/ItemsTable';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div>
      <h1 className="page-title">Product List</h1>
      <div className="section">
        <div className="section-body">
          <ItemsTable />
        </div>
      </div>
    </div>
  );
}

