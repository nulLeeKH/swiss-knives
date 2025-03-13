import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import ReactMarkdown from 'react-markdown';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  heading1: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  heading2: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  heading3: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  list: {
    marginLeft: 15,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 12,
    marginBottom: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface PDFGeneratorProps {
  content: string;
  title: string;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ content, title }) => {
  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown
        components={{
          h1: ({ children }) => <Text style={styles.heading1}>{children}</Text>,
          h2: ({ children }) => <Text style={styles.heading2}>{children}</Text>,
          h3: ({ children }) => <Text style={styles.heading3}>{children}</Text>,
          p: ({ children }) => <Text style={styles.text}>{children}</Text>,
          ul: ({ children }) => <View style={styles.list}>{children}</View>,
          li: ({ children }) => <Text style={styles.listItem}>• {children}</Text>,
          strong: ({ children }) => <Text style={styles.bold}>{children}</Text>,
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {renderMarkdown(content)}
      </Page>
    </Document>
  );
};

export default PDFGenerator;
