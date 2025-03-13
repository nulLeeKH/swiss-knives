'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

// Check if code is running in browser environment
const isBrowser = typeof window !== 'undefined';

export default function CVViewer() {
  // State declarations
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState('cv_blair_lee.pdf');
  const previewRef = useRef<HTMLDivElement>(null);
  const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false);

  // Fetch CV content on component mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/content/cv.md');
        if (!response.ok) {
          throw new Error('Failed to load CV content');
        }
        const data = await response.text();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Generate PDF from CV content
  const generatePDF = async () => {
    if (!content.trim() || !isBrowser) return;

    setIsGenerating(true);

    try {
      // Dynamically load html2pdf library
      if (!html2pdfLoaded) {
        await import('html2pdf.js');
        setHtml2pdfLoaded(true);
      }

      // Import html2pdf module
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      if (previewRef.current) {
        // Create a clone of the content for PDF generation to avoid modifying the visible content
        const contentClone = previewRef.current.cloneNode(true) as HTMLElement;

        // Apply global print styles to prevent content from being cut off between pages
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

        // Make sure sections stay together
        contentClone.querySelectorAll('.uk-section, section, .section').forEach(element => {
          (element as HTMLElement).style.pageBreakInside = 'avoid';
          (element as HTMLElement).style.breakInside = 'avoid';
        });

        // Validate and format filename
        let finalFileName = fileName.trim() || 'cv_blair_lee.pdf';
        if (!finalFileName.toLowerCase().endsWith('.pdf')) {
          finalFileName += '.pdf';
        }

        // PDF generation options
        const options = {
          margin: [15, 15, 15, 15] as [number, number, number, number],
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
            precision: 2,
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

  // Display only basic UI for server-side rendering
  if (!isBrowser) {
    return (
      <div className="uk-section uk-section-default">
        <div className="uk-container">
          <h1 className="uk-heading-medium uk-text-center">Curriculum Vitae</h1>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="uk-section uk-section-default">
      <div className="uk-container">
        <h1 className="uk-heading-medium uk-text-center">Curriculum Vitae</h1>

        {/* CV Content Display */}
        <div className="uk-card uk-card-default uk-card-body uk-margin-medium uk-width-2xlarge uk-margin-auto uk-box-shadow-small uk-border-rounded">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <div className="uk-article">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Hidden PDF Preview */}
        <div className="uk-hidden">
          <div
            ref={previewRef}
            className="pdf-preview avoid-page-break"
            style={{
              padding: '20px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              maxWidth: '210mm', // A4 width
            }}
          >
            <style type="text/css">{`
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                break-after: avoid;
              }
              h2, h3 {
                page-break-before: auto;
                break-before: auto;
                margin-top: 15px;
              }
              p, ul, ol, li, table, blockquote, pre {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              section, article, div.section {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .avoid-page-break {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .page-break-before {
                page-break-before: always;
                break-before: page;
              }
              .page-break-after {
                page-break-after: always;
                break-after: page;
              }
            `}</style>
            <div className="uk-article">
              <ReactMarkdown
                components={{
                  // Add page break prevention classes to heading elements
                  h1: ({ ...props }) => <h1 className="avoid-page-break" {...props} />,
                  h2: ({ ...props }) => <h2 className="avoid-page-break" {...props} />,
                  h3: ({ ...props }) => <h3 className="avoid-page-break" {...props} />,
                  // Add page break prevention classes to list and paragraph elements
                  ul: ({ ...props }) => <ul className="avoid-page-break" {...props} />,
                  ol: ({ ...props }) => <ol className="avoid-page-break" {...props} />,
                  p: ({ ...props }) => <p className="avoid-page-break" {...props} />,
                  // Add page break prevention classes to section elements
                  section: ({ ...props }) => <section className="avoid-page-break" {...props} />,
                  // Group related content together with special page break control
                  blockquote: ({ ...props }) => (
                    <blockquote className="force-page-break-before" {...props} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* PDF Download Section */}
        {!isLoading && !error && (
          <div className="uk-margin-large-top uk-flex uk-flex-center">
            <div className="uk-width-1-2@m">
              <div className="uk-card uk-card-default uk-card-body uk-box-shadow-small uk-border-rounded">
                <div className="uk-margin">
                  <label className="uk-form-label">Filename</label>
                  <div className="uk-form-controls">
                    <input
                      type="text"
                      className="uk-input"
                      value={fileName}
                      onChange={e => setFileName(e.target.value)}
                      placeholder="Enter filename"
                    />
                  </div>
                  <p className="uk-text-small uk-text-muted">
                    File extension (.pdf) will be added automatically if not provided.
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
