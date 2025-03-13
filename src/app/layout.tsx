import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import Navigation from '@/components/common/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digital Swiss Knives',
  description: 'All-in-One Digital Toolkit',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* UIkit CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/uikit@3.17.11/dist/css/uikit.min.css"
        />
        {/* UIkit JS scripts initialized after load using callback */}
        <Script
          src="https://cdn.jsdelivr.net/npm/uikit@3.17.11/dist/js/uikit.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/uikit@3.17.11/dist/js/uikit-icons.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        <div className="uk-offcanvas-content">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
