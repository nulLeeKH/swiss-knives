'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PDFGeneratorGrid from '@/components/pdf/PDFGeneratorGrid';

// Explicitly check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export default function PDFGeneratorClient() {
  const [content, setContent] = useState('');
  const [debouncedContent, setDebouncedContent] = useState('');
  const [showPDF, setShowPDF] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState('document.pdf');
  const previewRef = useRef<HTMLDivElement>(null);
  const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false);

  // PDF generation function (only runs on the client)
  const generatePDF = async () => {
    if (!debouncedContent.trim() || !isBrowser) return;

    setIsGenerating(true);

    try {
      // Dynamically load html2pdf library (client-side only)
      if (!html2pdfLoaded) {
        await import('html2pdf.js');
        setHtml2pdfLoaded(true);
      }

      // Dynamically import html2pdf
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      if (previewRef.current) {
        // Create a clone of the content for PDF generation to avoid modifying the visible content
        const contentClone = previewRef.current.cloneNode(true) as HTMLElement;

        // Add print-specific styling to the clone
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Prevent page breaks inside these elements */
            h1, h2, h3, h4, h5, h6, img, table, figure, ul, ol {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Control where page breaks should occur */
            p {
              orphans: 3; /* Min number of lines at bottom of page */
              widows: 3; /* Min number of lines at top of page */
            }
            
            /* Add page break before these elements */
            h1, h2, h3 {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            
            /* Ensure sections stay together */
            section, .section, .uk-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Ensure pre/code blocks don't overflow */
            pre, code {
              white-space: pre-wrap !important;
              word-break: break-word !important;
            }
          }
        `;
        contentClone.appendChild(styleElement);

        // Apply styles directly to elements to enforce page break behaviors
        contentClone
          .querySelectorAll('h1, h2, h3, h4, h5, h6, li, img, table, figure')
          .forEach(element => {
            (element as HTMLElement).style.pageBreakInside = 'avoid';
            (element as HTMLElement).style.breakInside = 'avoid';
          });

        // Apply styles to paragraphs to control orphans and widows
        contentClone.querySelectorAll('p').forEach(element => {
          (element as HTMLElement).style.orphans = '3';
          (element as HTMLElement).style.widows = '3';
        });

        // Apply styles to headings to avoid page breaks after them
        contentClone.querySelectorAll('h1, h2, h3').forEach(element => {
          (element as HTMLElement).style.pageBreakAfter = 'avoid';
          (element as HTMLElement).style.breakAfter = 'avoid';
        });

        // Make sure code blocks wrap properly
        contentClone.querySelectorAll('pre, code').forEach(element => {
          (element as HTMLElement).style.whiteSpace = 'pre-wrap';
          (element as HTMLElement).style.wordBreak = 'break-word';
        });

        // Verify filename and add .pdf extension if needed
        let finalFileName = fileName.trim() || 'document.pdf';
        if (!finalFileName.toLowerCase().endsWith('.pdf')) {
          finalFileName += '.pdf';
        }

        // PDF generation options
        const options = {
          margin: 15,
          filename: finalFileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            allowTaint: true,
            scrollY: 0,
            scrollX: 0,
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait' as 'portrait' | 'landscape',
            compress: true,
            putOnlyUsedFonts: true,
          },
          // Add specific font handling
          fontFaces: [
            { family: 'Arial', style: 'normal', weight: 'normal' },
            { family: 'Arial', style: 'normal', weight: 'bold' },
          ],
        };

        // Generate and download PDF using the clone instead of the original element
        await html2pdf().from(contentClone).set(options).save();
        console.log('PDF generation complete');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Debounce content changes
  useEffect(() => {
    if (!isBrowser) return;

    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, 1000); // Update after 1 second

    return () => clearTimeout(timer);
  }, [content]);

  // Set PDF display status whenever content changes
  useEffect(() => {
    if (!isBrowser) return;

    if (debouncedContent.trim() !== '') {
      setShowPDF(true);
    } else {
      setShowPDF(false);
    }
  }, [debouncedContent]);

  // Only show basic UI when rendering on the server
  if (!isBrowser) {
    return (
      <div className="uk-section uk-section-default">
        <div className="uk-container">
          <h1 className="uk-heading-medium uk-text-center">PDF Generator</h1>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="uk-section uk-section-default">
      <div className="uk-container">
        <h1 className="uk-heading-medium uk-text-center">PDF Generator</h1>

        <PDFGeneratorGrid content={content} onContentChange={setContent} />

        {/* PDF preview (hidden) */}
        <div className="uk-hidden">
          <div
            ref={previewRef}
            className="pdf-preview"
            style={{
              padding: '20px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              maxWidth: '210mm', // A4 width
            }}
          >
            {/* Markdown rendering */}
            <div className="uk-article">
              <ReactMarkdown>{debouncedContent}</ReactMarkdown>
            </div>
          </div>
        </div>

        {showPDF && (
          <div className="uk-margin-large-top uk-flex uk-flex-center">
            <div className="uk-width-1-2@m">
              <div className="uk-card uk-card-default uk-card-body">
                <div className="uk-margin">
                  <label className="uk-form-label">File Name</label>
                  <div className="uk-form-controls">
                    <input
                      type="text"
                      className="uk-input"
                      value={fileName}
                      onChange={e => setFileName(e.target.value)}
                      placeholder="Enter filename (e.g. document.pdf)"
                    />
                  </div>
                  <p className="uk-text-small uk-text-muted">
                    File extension (.pdf) will be added automatically if missing.
                  </p>
                </div>

                <div className="uk-text-center">
                  <button
                    className="uk-button uk-button-primary uk-button-large"
                    onClick={generatePDF}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
