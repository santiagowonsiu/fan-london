'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import fanLogo from '@/assets/icons/FAN-logo-horizontal-negro.png';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [showPurchasingDropdown, setShowPurchasingDropdown] = useState(false);

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const purchasingItems = [
    { href: '/external-orders', label: 'External Orders' },
    { href: '/purchasing/direct-purchases', label: 'Direct Purchases' },
    { href: '/purchasing/summary', label: 'Summary' },
    { href: '/purchasing/personal-expenses', label: 'Personal Expenses' }
  ];

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src={fanLogo} alt="FAN" height={32} width={120} style={{ height: 'auto', width: 'auto' }} />
        </Link>
          <nav className="nav">
            <Link href="/products" className={isActive('/products') ? 'active' : undefined}>
              Product List
            </Link>
          <Link href="/movements" className={isActive('/movements') ? 'active' : undefined}>
            Inventory Movements
          </Link>
          <Link href="/stock" className={isActive('/stock') ? 'active' : undefined}>
            Current Stock
          </Link>
          <Link href="/internal-orders" className={isActive('/internal-orders') ? 'active' : undefined}>
            Internal Orders
          </Link>
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setShowPurchasingDropdown(true)}
            onMouseLeave={() => setShowPurchasingDropdown(false)}
          >
            <span className={isActive('/purchasing') ? 'active' : undefined}>
              Purchasing
            </span>
            {showPurchasingDropdown && (
              <div className="dropdown-menu">
                {purchasingItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`dropdown-item ${isActive(item.href) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/suppliers" className={isActive('/suppliers') ? 'active' : undefined}>
            Suppliers
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

