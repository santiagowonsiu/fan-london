'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import Header from '@/components/Header';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <html lang="en">
      <body>
        {!isLandingPage && <Header />}
        <main className={isLandingPage ? '' : 'app-container'}>{children}</main>
      </body>
    </html>
  );
}

