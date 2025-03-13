'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Dynamically import client-side only component
const PDFGeneratorClientComponent = dynamic(() => import('@/components/pdf/PDFGeneratorClient'), {
  ssr: false,
  loading: () => (
    <div className="uk-section uk-section-default">
      <div className="uk-container uk-text-center">
        <h1 className="uk-heading-medium">PDF Generator</h1>
        <div className="uk-margin-large">
          <LoadingSpinner size={3} />
          <p className="uk-text-lead">Loading PDF Generator...</p>
        </div>
      </div>
    </div>
  ),
});

export default function PDFGenerator() {
  return <PDFGeneratorClientComponent />;
}
