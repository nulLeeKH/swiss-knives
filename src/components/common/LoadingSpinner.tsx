'use client';

import * as React from 'react';

interface LoadingSpinnerProps {
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 2 }) => {
  const spinnerSize = size * 30; // Base size 30px * size

  return (
    <div className="uk-text-center uk-margin">
      <div
        className="uk-spinner"
        role="status"
        style={{
          display: 'inline-block',
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #1e87f0',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `,
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
