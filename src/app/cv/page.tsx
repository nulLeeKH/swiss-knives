'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Dynamically import client-side only component
const CVViewer = dynamic(() => import('@/components/cv/CVViewer'), {
  ssr: false,
  loading: () => (
    <div className="uk-section uk-section-default">
      <div className="uk-container uk-text-center">
        <h1 className="uk-heading-medium">Curriculum Vitae</h1>
        <div className="uk-margin-large">
          <LoadingSpinner size={3} />
          <p className="uk-text-lead">Loading CV...</p>
        </div>
      </div>
    </div>
  ),
});

export default function CVPage() {
  return (
    <div className="uk-container uk-container-xlarge uk-margin-top uk-margin-bottom">
      <CVViewer />
    </div>
  );
}
