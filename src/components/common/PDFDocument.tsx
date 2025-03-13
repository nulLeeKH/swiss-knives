'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Document as PDFDocument,
  Page as PDFPage,
  Text as PDFText,
  View as PDFView,
} from '@react-pdf/renderer';

interface PDFComponentsType {
  Document: typeof PDFDocument;
  Page: typeof PDFPage;
  Text: typeof PDFText;
  View: typeof PDFView;
}

// Define types for PDF styles
type PDFStylesType = {
  [key in 'page' | 'section' | 'heading1' | 'paragraph' | 'list' | 'listItem' | 'code']: {
    [key: string]: string | number;
  };
};

// Create placeholder component without directly importing @react-pdf/renderer library
const PDFPlaceholder = () => (
  <div className="uk-text-center">
    <p>Loading PDF component...</p>
  </div>
);

// The actual PDFDocument component is only loaded in the browser
const PDFDocumentClient = ({ content }: { content: string }) => {
  // Load library and styles at runtime
  const [PDFComponents, setPDFComponents] = useState<PDFComponentsType | null>(null);
  const [styles, setStyles] = useState<PDFStylesType | null>(null);

  useEffect(() => {
    // Only execute on client side
    if (typeof window !== 'undefined') {
      import('@react-pdf/renderer')
        .then(({ Document, Page, Text, View }) => {
          setPDFComponents({ Document, Page, Text, View });

          // Set up styles
          setStyles({
            page: {
              padding: '30',
              fontSize: '12',
              lineHeight: '1.5',
              fontFamily: 'Helvetica',
            },
            section: {
              marginBottom: '10',
            },
            heading1: {
              fontSize: '24',
              fontWeight: 'bold',
              marginBottom: '10',
              marginTop: '15',
              fontFamily: 'Helvetica-Bold',
            },
            paragraph: {
              marginBottom: '10',
              orphans: '3',
              widows: '3',
            },
            list: {
              marginBottom: '10',
              marginLeft: '15',
            },
            listItem: {
              marginBottom: '5',
            },
            code: {
              fontFamily: 'Courier',
              backgroundColor: '#f5f5f5',
              padding: '5',
              fontSize: '10',
            },
          });
        })
        .catch(err => {
          console.error('Error loading PDF component:', err);
        });
    }
  }, []);

  // Return placeholder if components are not loaded yet
  if (!PDFComponents || !styles) {
    return <PDFPlaceholder />;
  }

  // Render PDF document when components are loaded
  const { Document, Page, Text, View } = PDFComponents;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.heading1}>Document</Text>
          {/* Improved content rendering with proper spacing */}
          {content.split('\n\n').map((paragraph, index) => (
            <View key={index} style={styles.paragraph}>
              <Text>{paragraph}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// Dynamically loaded client-only component
const doc = dynamic(() => Promise.resolve(PDFDocumentClient), {
  ssr: false,
  loading: () => <PDFPlaceholder />,
});

export default doc;
