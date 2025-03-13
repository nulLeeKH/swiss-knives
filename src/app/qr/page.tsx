'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import QRCodeGenerator from '@/components/qr/QRCodeGenerator';
import type { QRCodeScannerRef } from '@/components/qr/QRCodeScanner';
import type { QRDataType } from '@/components/qr/QRCodeGenerator';

// Dynamically import QRCodeScanner with no SSR
const QRCodeScanner = dynamic(() => import('@/components/qr/QRCodeScanner').then(mod => mod), {
  ssr: false,
});

type TabType = 'generate' | 'scan';

interface QRGenerateData {
  type: QRDataType;
  data: Record<string, string>;
}

// Component that uses useSearchParams
function QRContentInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [isScanning, setIsScanning] = useState(false);
  const [generateData, setGenerateData] = useState<QRGenerateData | null>(null);
  const scannerRef = useRef<QRCodeScannerRef>(null);

  // Read tab information from URL query parameters when page loads
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;

    if (tabParam && (tabParam === 'generate' || tabParam === 'scan')) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Set default value if no query parameter exists on initial load (runs once)
  useEffect(() => {
    const tabParam = searchParams.get('tab');

    if (!tabParam) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'generate');
      window.history.replaceState({}, '', url.toString());
    }

    // Store ref in a variable to use in cleanup
    const scanner = scannerRef.current;

    // Cleanup function to stop camera when component unmounts
    return () => {
      if (scanner) {
        scanner.stopCamera();
      }
    };
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    if (tab === 'generate') {
      setIsScanning(false);
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stopCamera();
      }
    }

    setActiveTab(tab);

    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  const handleGenerateFromScan = (type: QRDataType, data: Record<string, string>) => {
    setGenerateData({ type, data });
    handleTabChange('generate');
  };

  useEffect(() => {
    const scanner = scannerRef.current;
    if (isScanning && scanner) {
      scanner.startScanning();
    }
  }, [isScanning]);

  useEffect(() => {
    const scanner = scannerRef.current;
    return () => {
      if (scanner) {
        scanner.stopScanning();
      }
    };
  }, []);

  const handleScanResult = (result: string) => {
    // Handle scan result
    console.log('Scanned result:', result);
  };

  return (
    <div className="uk-container uk-margin-top uk-margin-bottom">
      <h1 className="uk-heading-medium">QR Code Tools</h1>

      <div className="uk-margin-medium-top">
        <ul className="uk-tab">
          <li className={activeTab === 'generate' ? 'uk-active' : ''}>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                handleTabChange('generate');
              }}
            >
              Generate QR Code
            </a>
          </li>
          <li className={activeTab === 'scan' ? 'uk-active' : ''}>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                handleTabChange('scan');
              }}
            >
              Scan QR Code
            </a>
          </li>
        </ul>

        <div className="uk-margin">
          {activeTab === 'generate' && <QRCodeGenerator initialData={generateData} />}
          {activeTab === 'scan' && (
            <div className="uk-card uk-card-default uk-card-body">
              <h2 className="uk-card-title">QR Code Scanner</h2>
              <div className="uk-text-muted uk-margin-bottom">
                Position a QR code in front of your camera to scan it
              </div>
              <QRCodeScanner
                ref={scannerRef}
                onScan={handleScanResult}
                onGenerate={handleGenerateFromScan}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
function QRContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QRContentInner />
    </Suspense>
  );
}

export default function QRPage() {
  return <QRContent />;
}
