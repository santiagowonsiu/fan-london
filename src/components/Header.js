'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import fanLogo from '@/assets/icons/FAN-logo-horizontal-negro.png';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [showPurchasingDropdown, setShowPurchasingDropdown] = useState(false);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [showStockDropdown, setShowStockDropdown] = useState(false);

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

  const itemsMenuItems = [
    { href: '/product-types', label: 'Product Types' },
    { href: '/products', label: 'Product List' },
    { href: '/production', label: 'Production List', disabled: true }
  ];

  const stockMenuItems = [
    { href: '/movements', label: 'Inventory Movements' },
    { href: '/stock', label: 'Current Stock' }
  ];

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src={fanLogo} alt="FAN" height={32} width={120} style={{ height: 'auto', width: 'auto' }} />
        </Link>
          <nav className="nav">
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setShowItemsDropdown(true)}
            onMouseLeave={() => setShowItemsDropdown(false)}
          >
            <span className={isActive('/products') || isActive('/product-types') || isActive('/production') ? 'active' : undefined}>
              Items
            </span>
            {showItemsDropdown && (
              <div className="dropdown-menu">
                {itemsMenuItems.map((item) => (
                  item.disabled ? (
                    <span
                      key={item.href}
                      className="dropdown-item disabled"
                      style={{ color: '#9ca3af', cursor: 'not-allowed' }}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`dropdown-item ${isActive(item.href) ? 'active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setShowStockDropdown(true)}
            onMouseLeave={() => setShowStockDropdown(false)}
          >
            <span className={isActive('/movements') || isActive('/stock') ? 'active' : undefined}>
              Stock
            </span>
            {showStockDropdown && (
              <div className="dropdown-menu">
                {stockMenuItems.map((item) => (
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
          <Link href="/internal-orders" className={isActive('/internal-orders') ? 'active' : undefined}>
            Internal Orders
          </Link>
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setShowPurchasingDropdown(true)}
            onMouseLeave={() => setShowPurchasingDropdown(false)}
          >
            <span className={isActive('/purchasing') || isActive('/external-orders') ? 'active' : undefined}>
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

