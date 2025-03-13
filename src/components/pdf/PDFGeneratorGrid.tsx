'use client';

import * as React from 'react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

interface PDFGeneratorGridProps {
  content: string;
  onContentChange: (content: string) => void;
}

export default function PDFGeneratorGrid({ content, onContentChange }: PDFGeneratorGridProps) {
  return (
    <div className="uk-flex">
      <div className="uk-width-1-2 uk-padding-small">
        <div className="uk-card uk-card-default uk-card-body">
          <h2 className="uk-card-title">Input</h2>
          <div className="uk-margin">
            <textarea
              className="uk-textarea"
              rows={20}
              value={content}
              onChange={e => onContentChange(e.target.value)}
              placeholder="Enter markdown content to generate PDF"
            />
          </div>
        </div>
      </div>

      <div className="uk-width-1-2 uk-padding-small">
        <div className="uk-card uk-card-default uk-card-body">
          <h2 className="uk-card-title">Preview</h2>
          <div className="uk-height-1-1 uk-overflow-auto">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
