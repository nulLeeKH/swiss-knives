'use client';

import * as React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="uk-alert-danger" uk-alert="true">
      <p>{message}</p>
      {onRetry && (
        <button className="uk-button uk-button-danger" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
