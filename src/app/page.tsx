'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

// Tool definitions for the application
const tools = [
  {
    title: 'Roulette',
    description: 'Generate random options with customizable weights',
    link: '/roulette',
    newTab: false,
  },
  {
    title: 'QR Code',
    description: 'Create and download custom QR codes',
    link: '/qr',
    newTab: false,
  },
  {
    title: 'PDF Generator',
    description: 'Convert markdown to downloadable PDFs',
    link: '/pdf',
    newTab: false,
  },
  {
    title: 'Instagram Frame',
    description: 'Create beautiful Instagram frames with custom text and logos',
    link: '/frame',
    newTab: false,
  },
];

export default function Home() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch CV content on component mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/content/cv.md');
        if (!response.ok) {
          throw new Error('Failed to fetch CV content');
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

  // Handle external link opening in new tab
  const handleExternalLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="uk-section uk-section-default">
      <div className="uk-container">
        {/* Header Section */}
        <div className="uk-text-center uk-margin-large-bottom">
          <h1 className="uk-heading-medium">Digital Swiss Knives</h1>
          <p className="uk-text-lead">My All-in-One Digital Toolkit</p>
        </div>

        <div className="uk-flex uk-flex-wrap">
          {/* CV Section */}
          <div className="uk-width-1-1 uk-width-1-2@m uk-padding-small">
            <div className="uk-card uk-card-default uk-card-body uk-box-shadow-small uk-border-rounded">
              <div className="uk-card-title uk-flex uk-flex-middle">
                <h2 className="uk-margin-remove">Curriculum Vitae</h2>
                <a
                  href="/cv"
                  onClick={e => handleExternalLink(e, '/cv')}
                  className="uk-margin-small-left"
                  title="Open CV in a new tab"
                  aria-label="Open CV in a new tab"
                >
                  <span className="uk-icon" data-uk-icon="icon: link; ratio: 0.8"></span>
                </a>
              </div>
              {isLoading ? (
                <LoadingSpinner />
              ) : error ? (
                <ErrorMessage message={error} />
              ) : (
                <a
                  href="/cv"
                  onClick={e => handleExternalLink(e, '/cv')}
                  className="uk-link-reset"
                  title="Open full CV in a new tab"
                >
                  <div className="uk-margin-top">
                    <MarkdownRenderer content={content} />
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Tools Section */}
          <div className="uk-width-1-1 uk-width-1-2@m uk-padding-small">
            <div className="uk-card uk-card-default uk-card-body uk-box-shadow-small uk-border-rounded">
              <h2 className="uk-card-title">Tools</h2>
              <div className="uk-grid-small uk-child-width-1-2@s" data-uk-grid>
                {tools.map(tool => (
                  <div key={tool.title}>
                    {tool.newTab ? (
                      <a
                        href={tool.link}
                        className="uk-card uk-card-default uk-card-body uk-card-hover uk-border-rounded uk-box-shadow-hover-medium uk-height-small uk-flex uk-flex-column uk-flex-center"
                        onClick={e => handleExternalLink(e, tool.link)}
                      >
                        <h3 className="uk-card-title uk-margin-remove-bottom">
                          {tool.title}
                          <span
                            className="uk-icon uk-margin-small-left"
                            data-uk-icon="icon: link; ratio: 0.8"
                            title="Open in a new tab"
                          ></span>
                        </h3>
                        <p className="uk-text-small uk-margin-small-top">{tool.description}</p>
                      </a>
                    ) : (
                      <Link
                        href={tool.link}
                        className="uk-card uk-card-default uk-card-body uk-card-hover uk-border-rounded uk-box-shadow-hover-medium uk-height-small uk-flex uk-flex-column uk-flex-center"
                      >
                        <h3 className="uk-card-title uk-margin-remove-bottom">{tool.title}</h3>
                        <p className="uk-text-small uk-margin-small-top">{tool.description}</p>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="uk-text-center uk-margin-large-top">
          <div className="uk-flex uk-flex-center uk-flex-middle">
            <a
              href="https://twitter.com/blir_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="uk-margin-right uk-icon-button"
              data-uk-icon="twitter"
              aria-label="Twitter Profile"
            ></a>
            <a
              href="https://github.com/nulLeeKH"
              target="_blank"
              rel="noopener noreferrer"
              className="uk-margin-right uk-icon-button"
              data-uk-icon="github"
              aria-label="GitHub Profile"
            ></a>
            <a
              href="https://linkedin.com/in/kyung-ha-lee-4b3b3322a"
              target="_blank"
              rel="noopener noreferrer"
              className="uk-margin-right uk-icon-button"
              data-uk-icon="linkedin"
              aria-label="LinkedIn Profile"
            ></a>
            <a
              href="mailto:iam@blairlee.me"
              className="uk-margin-right uk-icon-button"
              data-uk-icon="mail"
              aria-label="Send Email"
            ></a>
          </div>
          <p className="uk-text-small uk-margin-top uk-text-muted">
            © 2023 Blair Lee. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
