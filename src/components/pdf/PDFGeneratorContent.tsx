'use client';

import * as React from 'react';
import { useState, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';
import PDFDocument from '@/components/common/PDFDocument';
import type { PDFDownloadLink as PDFDownloadLinkType, DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

// Wrapper component to dynamically load PDFDownloadLink at runtime
const PDFDownloadLinkClient = ({
  document,
  fileName,
  className,
  children,
}: {
  document: ReactElement<DocumentProps>;
  fileName: string;
  className?: string;
  children: (props: { loading: boolean }) => React.ReactNode;
}) => {
  const [PDFDownloadLink, setPDFDownloadLink] = useState<typeof PDFDownloadLinkType | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only load the library on the client side
      import('@react-pdf/renderer')
        .then(module => {
          setPDFDownloadLink(() => module.PDFDownloadLink);
        })
        .catch(error => {
          console.error('Error loading @react-pdf/renderer:', error);
        });
    }
  }, []);

  // Show loading state if the component hasn't loaded yet
  if (!PDFDownloadLink) {
    return (
      <button className={className} disabled>
        {children({ loading: true })}
      </button>
    );
  }

  // Render the PDF download link once the component is loaded
  const DownloadLink = PDFDownloadLink;
  return (
    <DownloadLink document={document} fileName={fileName} className={className}>
      {children}
    </DownloadLink>
  );
};

// Dynamically loaded client-only PDFDownloadLink
const DynamicPDFDownloadLink = dynamic(() => Promise.resolve(PDFDownloadLinkClient), {
  ssr: false,
  loading: () => (
    <button className="uk-button uk-button-primary uk-button-large" disabled>
      Loading PDF Component...
    </button>
  ),
});

interface PDFGeneratorContentProps {
  content: string;
}

const PDFGeneratorContent = memo(({ content }: PDFGeneratorContentProps) => {
  const [key, setKey] = useState(0);

  // Change the key whenever the content changes to remount the component
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [content]);

  if (!content.trim()) {
    return null;
  }

  return (
    <div key={key}>
      <DynamicPDFDownloadLink
        document={<PDFDocument content={content} />}
        fileName="document.pdf"
        className="uk-button uk-button-primary uk-button-large"
      >
        {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
      </DynamicPDFDownloadLink>
    </div>
  );
});

PDFGeneratorContent.displayName = 'PDFGeneratorContent';

export default PDFGeneratorContent;
