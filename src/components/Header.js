'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import fanLogo from '@/assets/icons/FAN-logo-horizontal-negro.png';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src={fanLogo} alt="FAN" height={32} width={120} style={{ height: 'auto', width: 'auto' }} />
        </Link>
        <nav className="nav">
          <Link href="/" className={isActive('/') ? 'active' : undefined}>
            Product List
          </Link>
          <Link href="/transactions" className={isActive('/transactions') ? 'active' : undefined}>
            Transactions
          </Link>
          <Link href="/logs" className={isActive('/logs') ? 'active' : undefined}>
            Transaction Logs
          </Link>
          <Link href="/stock" className={isActive('/stock') ? 'active' : undefined}>
            Current Stock
          </Link>
          <Link href="/internal-orders" className={isActive('/internal-orders') ? 'active' : undefined}>
            Internal Orders
          </Link>
          <Link href="/external-orders" className={isActive('/external-orders') ? 'active' : undefined}>
            External Orders
          </Link>
          <Link href="/activity" className={isActive('/activity') ? 'active' : undefined}>
            Activity Log
          </Link>
          <Link href="/settings" className={isActive('/settings') ? 'active' : undefined}>
            Settings
          </Link>
          <Link href="/account" className={isActive('/account') ? 'active' : undefined}>
            Account
          </Link>
        </nav>
      </div>
    </header>
  );
}

