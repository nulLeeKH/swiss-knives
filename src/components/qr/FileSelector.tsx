'use client';

import React, { useState, useRef, useEffect } from 'react';

interface FileSelectorProps {
  onFileSelect: (files: File[]) => void; // Function to handle selected files
  accept?: string;
  buttonText?: string;
  dropzoneText?: string;
  className?: string;
  maxSize?: number; // In MB
  showPreview?: boolean;
  multiple?: boolean;
  // Custom validation function
  validateFile?: (file: File) => { isValid: boolean; errorMessage?: string };
}

const FileSelector: React.FC<FileSelectorProps> = ({
  onFileSelect,
  accept = 'image/*',
  buttonText = 'Select File',
  dropzoneText = 'Drag & drop a file or click to select',
  className = '',
  maxSize = 5, // 5MB default
  showPreview = true,
  multiple = false,
  validateFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear error when props change
  useEffect(() => {
    setError(null);
  }, [accept, maxSize]);

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Default validation function
  const defaultValidateFile = (file: File) => {
    // Check if file type is accepted
    if (accept !== '*' && accept !== '') {
      const fileType = file.type;
      const acceptedTypes = accept.split(',').map(type => type.trim());

      // Check if the file type matches any of the accepted types
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Handle wildcards like "image/*"
          const mainType = type.split('/')[0];
          return fileType.startsWith(`${mainType}/`);
        }
        return type === fileType;
      });

      if (!isAccepted) {
        return {
          isValid: false,
          errorMessage: `File type not accepted. Please upload ${accept}`,
        };
      }
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      return {
        isValid: false,
        errorMessage: `File is too large. Maximum size is ${maxSize}MB.`,
      };
    }

    return { isValid: true };
  };

  // Generate preview for image files
  const generatePreview = (file: File) => {
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          setPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files, just clear the preview
      setPreview(null);
    }
  };

  // Process the files through validation and preview generation
  const processFiles = (filesArray: FileList | File[]) => {
    setIsLoading(true);
    setError(null);

    // Convert FileList to Array if needed
    const files = Array.from(filesArray);

    if (files.length === 0) {
      setIsLoading(false);
      return;
    }

    // If multiple is false, only process the first file
    const filesToProcess = multiple ? files : [files[0]];

    // Validate all files
    let isValid = true;
    let errorMsg = '';

    for (const file of filesToProcess) {
      // Use custom validation if provided, otherwise use default
      const validationResult = validateFile ? validateFile(file) : defaultValidateFile(file);

      if (!validationResult.isValid) {
        isValid = false;
        errorMsg = validationResult.errorMessage || 'File validation failed';
        break;
      }
    }

    if (isValid) {
      // Generate preview for the first file
      if (filesToProcess.length > 0) {
        generatePreview(filesToProcess[0]);
      }

      // Call the onFileSelect callback with valid files
      onFileSelect(filesToProcess);
    } else {
      setError(errorMsg);
      setPreview(null);
    }

    // Always reset the file input after processing to allow re-selection of the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsLoading(false);
  };

  // Event handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-selector ${className}`} style={{ width: '100%' }}>
      <div
        className={`uk-placeholder uk-text-center ${isDragging ? 'uk-box-shadow-medium uk-background-muted' : ''}`}
        style={{
          border: isDragging ? '2px dashed #1e87f0' : '1px dashed #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="uk-margin">
            <span uk-spinner="ratio: 1"></span>
            <p>Processing file{multiple ? 's' : ''}...</p>
          </div>
        ) : (
          <>
            <div className="uk-flex uk-flex-column uk-flex-middle">
              <span uk-icon="icon: cloud-upload; ratio: 2"></span>
              <p className="uk-margin-small">{dropzoneText}</p>
            </div>

            {error && (
              <div className="uk-alert uk-alert-danger uk-margin-small uk-border-rounded" uk-alert>
                <p>{error}</p>
              </div>
            )}

            <div className="uk-margin-top">
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                multiple={multiple}
              />
              <button
                className="uk-button uk-button-primary uk-border-rounded uk-width-1-1 uk-width-auto@s"
                type="button"
              >
                {buttonText}
              </button>
            </div>

            <p className="uk-text-meta uk-margin-small-top">
              {multiple ? 'Multiple files supported' : 'Single file only'} | Max size: {maxSize}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileSelector;
