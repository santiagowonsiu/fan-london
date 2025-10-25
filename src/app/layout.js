'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import Header from '@/components/Header';
import { OrganizationProvider } from '@/contexts/OrganizationContext';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <html lang="en">
      <body>
        <OrganizationProvider>
          {!isLandingPage && <Header />}
          <main className={isLandingPage ? '' : 'app-container'}>{children}</main>
        </OrganizationProvider>
      </body>
    </html>
  );
}

