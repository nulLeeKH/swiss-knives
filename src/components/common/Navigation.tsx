'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navigation() {
  const pathname = usePathname();

  // Hide navigation bar on main page
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="uk-navbar-container uk-box-shadow-small">
      <div className="uk-container">
        <div className="uk-navbar">
          <div className="uk-navbar-left">
            <Link className="uk-navbar-item uk-logo" href="/">
              Digital Swiss Knife
            </Link>
          </div>
          <div className="uk-navbar-right">
            <ul className="uk-navbar-nav">
              <li className={pathname === '/roulette' ? 'uk-active' : ''}>
                <Link href="/roulette">Roulette</Link>
              </li>
              <li className={pathname === '/qr' ? 'uk-active' : ''}>
                <Link href="/qr">QR Code</Link>
              </li>
              <li className={pathname === '/pdf' ? 'uk-active' : ''}>
                <Link href="/pdf">PDF Generator</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
