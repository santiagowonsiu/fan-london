'use client';

import './globals.css';
import Header from '@/components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="app-container">{children}</main>
      </body>
    </html>
  );
}

