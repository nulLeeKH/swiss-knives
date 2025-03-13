'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCodeForm from './QRCodeForm';

export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type QRDataType = 'text_url' | 'wifi' | 'email' | 'tel' | 'sms' | 'vcard';

export const ERROR_CORRECTION_DESCRIPTIONS = {
  L: 'Low (approx. 7% recovery)',
  M: 'Medium (approx. 15% recovery)',
  Q: 'High (approx. 25% recovery)',
  H: 'Highest (approx. 30% recovery)',
};

const DEFAULT_SIZE = 200;
const DEFAULT_ERROR_CORRECTION: QRErrorCorrectionLevel = 'M';
// const DEFAULT_OVERLAY_SIZE = 50; // Unused constant
const DEFAULT_DATA_TYPE: QRDataType = 'text_url';

export type StructuredDataFields = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
  fullName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  homePhone?: string;
  email?: string;
  workEmail?: string;
  homeEmail?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  workStreet?: string;
  workCity?: string;
  workState?: string;
  workZip?: string;
  workCountry?: string;
  homeStreet?: string;
  homeCity?: string;
  homeState?: string;
  homeZip?: string;
  homeCountry?: string;
  note?: string;

  // Raw address data
  addressRaw?: string;
  workAddressRaw?: string;
  homeAddressRaw?: string;

  // Formatted addresses
  address?: string;
  workAddress?: string;
  homeAddress?: string;

  ssid?: string;
  password?: string;
  encryption?: string;
  hidden?: string | boolean;

  latitude?: string;
  longitude?: string;
  altitude?: string;

  subject?: string;
  body?: string;
  emailSubject?: string;
  emailBody?: string;

  message?: string;
  smsMessage?: string;

  poBox?: string;
  extAddr?: string;
  workPoBox?: string;
  workExtAddr?: string;
  homePoBox?: string;
  homeExtAddr?: string;

  [key: string]: string | boolean | undefined;
};

export default function QRCodeGenerator({
  initialData,
}: {
  initialData?: { type: QRDataType; data: Record<string, string> } | null;
}) {
  const [dataType, setDataType] = useState<QRDataType>(initialData?.type || DEFAULT_DATA_TYPE);
  const [text, setText] = useState(
    initialData?.type === 'text_url' ? initialData.data.text || '' : ''
  );
  const [structuredData, setStructuredData] = useState<StructuredDataFields>(
    initialData?.type !== 'text_url' ? initialData?.data || {} : {}
  );
  const [structuredDataVersion, setStructuredDataVersion] = useState(0);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [errorCorrection, setErrorCorrection] =
    useState<QRErrorCorrectionLevel>(DEFAULT_ERROR_CORRECTION);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlaySize, setOverlaySize] = useState(25);
  const [generatedQRValue, setGeneratedQRValue] = useState('');
  const [autoUpdateFullName, setAutoUpdateFullName] = useState(true);

  const qrRef = useRef<HTMLDivElement>(null);

  const updateStructuredField = (field: string, value: string) => {
    setStructuredData(prevData => ({
      ...prevData,
      [field]: value,
    }));
    setStructuredDataVersion(prev => prev + 1);
  };

  useEffect(() => {
    let qrContent = '';

    switch (dataType) {
      case 'text_url':
        if (text.match(/^https?:\/\//i)) {
          qrContent = text;
        } else if (text.match(/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i)) {
          qrContent = `https://${text}`;
        } else {
          qrContent = text;
        }
        break;

      case 'wifi':
        const encType =
          structuredData.encryption === 'none' ? 'nopass' : structuredData.encryption || 'WPA';

        const escapedSSID = (structuredData.ssid || '').replace(/([\\;:,])/g, '\\$1');
        const escapedPassword = (structuredData.password || '').replace(/([\\;:,])/g, '\\$1');

        const hiddenValue =
          structuredData.hidden === true || structuredData.hidden === 'true' ? 'true' : 'false';

        qrContent = `WIFI:S:${escapedSSID};T:${encType};P:${escapedPassword};H:${hiddenValue};;`;
        break;

      case 'email':
        const email = structuredData.email || '';

        qrContent = `mailto:${email}`;

        if (structuredData.subject || structuredData.body) {
          const params = new URLSearchParams();
          if (structuredData.subject) params.append('subject', structuredData.subject);
          if (structuredData.body) params.append('body', structuredData.body);
          qrContent += `?${params.toString()}`;
        }
        break;

      case 'tel':
        qrContent = `tel:${(structuredData.phone || '').replace(/\s+/g, '')}`;
        break;

      case 'sms':
        const cleanSmsPhone = structuredData.phone ? structuredData.phone.replace(/\s+/g, '') : '';

        qrContent = `SMSTO:${cleanSmsPhone}:${structuredData.message || ''}`;
        break;

      case 'vcard':
        const vCardLines = ['BEGIN:VCARD', 'VERSION:3.0'];

        // Handle name fields
        if (
          structuredData.lastName ||
          structuredData.firstName ||
          structuredData.middleName ||
          structuredData.prefix ||
          structuredData.suffix
        ) {
          vCardLines.push(
            `N:${structuredData.lastName || ''};${structuredData.firstName || ''};${structuredData.middleName || ''};${structuredData.prefix || ''};${structuredData.suffix || ''}`
          );

          if (structuredData.fullName) {
            vCardLines.push(`FN:${structuredData.fullName}`);
          } else {
            const nameParts = [];
            if (structuredData.prefix) nameParts.push(structuredData.prefix);
            if (structuredData.firstName) nameParts.push(structuredData.firstName);
            if (structuredData.middleName) nameParts.push(structuredData.middleName);
            if (structuredData.lastName) nameParts.push(structuredData.lastName);
            if (structuredData.suffix) nameParts.push(structuredData.suffix);

            vCardLines.push(`FN:${nameParts.join(' ')}`);
          }
        } else if (structuredData.fullName) {
          vCardLines.push(`FN:${structuredData.fullName}`);
          vCardLines.push(`N:;${structuredData.fullName};;;`);
        }

        // Organization and title
        if (structuredData.organization) {
          vCardLines.push(`ORG:${structuredData.organization}`);
        }
        if (structuredData.title) {
          vCardLines.push(`TITLE:${structuredData.title}`);
        }

        // Phone numbers according to vCard 3.0 standard
        if (structuredData.phone) {
          vCardLines.push(`TEL;TYPE=PREF:${structuredData.phone}`);
        }
        if (structuredData.mobilePhone) {
          vCardLines.push(`TEL;TYPE=CELL:${structuredData.mobilePhone}`);
        }
        if (structuredData.workPhone) {
          vCardLines.push(`TEL;TYPE=WORK:${structuredData.workPhone}`);
        }
        if (structuredData.homePhone) {
          vCardLines.push(`TEL;TYPE=HOME:${structuredData.homePhone}`);
        }

        // Email addresses according to vCard 3.0 standard
        if (structuredData.email) {
          vCardLines.push(`EMAIL;TYPE=PREF:${structuredData.email}`);
        }
        if (structuredData.workEmail) {
          vCardLines.push(`EMAIL;TYPE=WORK:${structuredData.workEmail}`);
        }
        if (structuredData.homeEmail) {
          vCardLines.push(`EMAIL;TYPE=HOME:${structuredData.homeEmail}`);
        }

        // Website
        if (structuredData.website) {
          vCardLines.push(`URL:${structuredData.website}`);
        }

        // Addresses
        if (
          structuredData.address ||
          structuredData.street ||
          structuredData.city ||
          structuredData.state ||
          structuredData.zip ||
          structuredData.country ||
          structuredData.poBox ||
          structuredData.extAddr
        ) {
          const addressParts = [];
          addressParts.push(structuredData.poBox || ''); // PO Box
          addressParts.push(structuredData.extAddr || ''); // Extended Address
          addressParts.push(structuredData.street || '');
          addressParts.push(structuredData.city || '');
          addressParts.push(structuredData.state || '');
          addressParts.push(structuredData.zip || '');
          addressParts.push(structuredData.country || '');
          vCardLines.push(`ADR;TYPE=PREF:${addressParts.join(';')}`);
        }

        if (
          structuredData.workAddress ||
          structuredData.workStreet ||
          structuredData.workCity ||
          structuredData.workState ||
          structuredData.workZip ||
          structuredData.workCountry ||
          structuredData.workPoBox ||
          structuredData.workExtAddr
        ) {
          const workAddressParts = [];
          workAddressParts.push(structuredData.workPoBox || ''); // PO Box
          workAddressParts.push(structuredData.workExtAddr || ''); // Extended Address
          workAddressParts.push(structuredData.workStreet || '');
          workAddressParts.push(structuredData.workCity || '');
          workAddressParts.push(structuredData.workState || '');
          workAddressParts.push(structuredData.workZip || '');
          workAddressParts.push(structuredData.workCountry || '');
          vCardLines.push(`ADR;TYPE=WORK:${workAddressParts.join(';')}`);
        }

        if (
          structuredData.homeAddress ||
          structuredData.homeStreet ||
          structuredData.homeCity ||
          structuredData.homeState ||
          structuredData.homeZip ||
          structuredData.homeCountry ||
          structuredData.homePoBox ||
          structuredData.homeExtAddr
        ) {
          const homeAddressParts = [];
          homeAddressParts.push(structuredData.homePoBox || ''); // PO Box
          homeAddressParts.push(structuredData.homeExtAddr || ''); // Extended Address
          homeAddressParts.push(structuredData.homeStreet || '');
          homeAddressParts.push(structuredData.homeCity || '');
          homeAddressParts.push(structuredData.homeState || '');
          homeAddressParts.push(structuredData.homeZip || '');
          homeAddressParts.push(structuredData.homeCountry || '');
          vCardLines.push(`ADR;TYPE=HOME:${homeAddressParts.join(';')}`);
        }

        // Note
        if (structuredData.note) {
          vCardLines.push(`NOTE:${structuredData.note}`);
        }

        // Geo location
        const validLat = structuredData.latitude && !isNaN(parseFloat(structuredData.latitude));
        const validLon = structuredData.longitude && !isNaN(parseFloat(structuredData.longitude));

        if (validLat || validLon) {
          const lat = validLat ? parseFloat(structuredData.latitude ?? '0').toFixed(6) : '0.000000';
          const lon = validLon
            ? parseFloat(structuredData.longitude ?? '0').toFixed(6)
            : '0.000000';
          vCardLines.push(`GEO:${lat};${lon}`);

          if (structuredData.altitude && !isNaN(parseFloat(structuredData.altitude))) {
            const alt = parseFloat(structuredData.altitude).toFixed(2);
            vCardLines.push(`X-ALTITUDE:${alt}`);
          }
        }

        vCardLines.push('END:VCARD');
        qrContent = vCardLines.join('\n');
        break;

      default:
        qrContent = text;
    }

    setGeneratedQRValue(qrContent);
  }, [dataType, text, structuredData, structuredDataVersion]);

  useEffect(() => {
    if (dataType === 'vcard' && autoUpdateFullName) {
      if (structuredData.fullName && structuredData.manualFullName) {
        return;
      }

      const nameParts = [];
      if (structuredData.prefix) nameParts.push(structuredData.prefix);
      if (structuredData.firstName) nameParts.push(structuredData.firstName);
      if (structuredData.middleName) nameParts.push(structuredData.middleName);
      if (structuredData.lastName) nameParts.push(structuredData.lastName);
      if (structuredData.suffix) nameParts.push(structuredData.suffix);

      const fullName = nameParts.join(' ').trim();

      if (fullName && fullName !== structuredData.fullName) {
        setStructuredData(prev => ({
          ...prev,
          fullName: fullName,
        }));
        setStructuredDataVersion(prev => prev + 1);
      }
    }
  }, [
    dataType,
    structuredData.prefix,
    structuredData.firstName,
    structuredData.middleName,
    structuredData.lastName,
    structuredData.suffix,
    structuredData.fullName,
    structuredData.manualFullName,
    autoUpdateFullName,
  ]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const imgSrc = e.target?.result as string;
      setOverlayImage(imgSrc);

      const img = new window.Image();
      img.onload = () => {
        setImageAspectRatio(img.width / img.height);
      };
      img.src = imgSrc;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!qrRef.current || !isQRCodeEnabled()) return;

    try {
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) return;

      const originalWidth = svgElement.getAttribute('width');
      const originalHeight = svgElement.getAttribute('height');
      svgElement.setAttribute('width', `${size * 3}px`);
      svgElement.setAttribute('height', `${size * 3}px`);

      const canvas = document.createElement('canvas');
      canvas.width = size * 3;
      canvas.height = size * 3;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D context from canvas');
      }

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgURL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (overlayImage) {
          const overlayImg = new window.Image();
          overlayImg.onload = () => {
            const overlayWidth = (canvas.width * overlaySize) / 100;
            const overlayHeight = overlayWidth / imageAspectRatio;

            const x = (canvas.width - overlayWidth) / 2;
            const y = (canvas.height - overlayHeight) / 2;

            ctx.drawImage(overlayImg, x, y, overlayWidth, overlayHeight);

            downloadImage(canvas);
          };
          overlayImg.src = overlayImage;
        } else {
          downloadImage(canvas);
        }

        svgElement.setAttribute('width', originalWidth || '');
        svgElement.setAttribute('height', originalHeight || '');
      };

      img.src = svgURL;
    } catch (error) {
      console.error('Error generating QR code image:', error);
      showNotification('Failed to generate QR code image', 'error');
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement) => {
    try {
      let suggestedFileName = 'qr_code';

      const sanitizeFileName = (name: string): string => {
        return name.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, '_');
      };

      switch (dataType) {
        case 'text_url':
          if (
            text.match(/^(https?:\/\/)/i) ||
            text.match(/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/i)
          ) {
            const domain = text.replace(/^https?:\/\//i, '').split('/')[0];
            suggestedFileName = `qr_${domain}`;
          } else if (text.length > 0) {
            const cleanText = sanitizeFileName(text.substring(0, 10));
            if (cleanText) suggestedFileName = `qr_${cleanText}`;
          }
          break;
        case 'wifi':
          if (structuredData.ssid) {
            const ssid = sanitizeFileName(structuredData.ssid);
            suggestedFileName = `qr_wifi_${ssid}`;
          }
          break;
        case 'email':
          if (structuredData.email) {
            const username = sanitizeFileName(structuredData.email.split('@')[0]);
            suggestedFileName = `qr_email_${username}`;
          }
          break;
        case 'tel':
          if (structuredData.phone) {
            const phone = structuredData.phone.replace(/\D/g, '').substring(0, 10);
            suggestedFileName = `qr_tel_${phone}`;
          }
          break;
        case 'vcard':
          if (structuredData.firstName || structuredData.lastName) {
            const name = sanitizeFileName(
              `${structuredData.firstName || ''}_${structuredData.lastName || ''}`
            ).trim();
            if (name) suggestedFileName = `qr_contact_${name}`;
          }
          break;
        case 'sms':
          if (structuredData.phone) {
            const phone = structuredData.phone.replace(/\D/g, '').substring(0, 10);
            suggestedFileName = `qr_sms_${phone}`;
          }
          break;
      }

      suggestedFileName = `${suggestedFileName}.png`;

      canvas.toBlob(blob => {
        if (!blob) {
          throw new Error('Failed to create blob from canvas');
        }

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = suggestedFileName;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        showNotification('QR code has been successfully downloaded.');
      }, 'image/png');
    } catch (error) {
      console.error('Download error:', error);
      showNotification('QR code download failed', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    notification.className = `uk-notification-message uk-notification-message-${type} uk-animation-slide-bottom`;
    notification.innerHTML = `
      <div class="uk-notification-message-content">
        <div class="uk-flex uk-flex-middle">
          <span uk-icon="icon: ${type === 'success' ? 'check' : 'warning'}; ratio: 1.2" class="uk-margin-small-right"></span>
          <div>${message}</div>
        </div>
      </div>
    `;

    const notificationContainer =
      document.querySelector('.uk-notification') ||
      (() => {
        const container = document.createElement('div');
        container.className = 'uk-notification uk-notification-top-right';
        document.body.appendChild(container);
        return container;
      })();

    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('uk-animation-slide-right-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const isQRCodeEnabled = () => {
    switch (dataType) {
      case 'text_url':
        return text.trim() !== '';
      case 'wifi':
        return (
          structuredData.ssid &&
          structuredData.ssid.trim() !== '' &&
          (structuredData.encryption === 'none' ||
            (structuredData.password && structuredData.password.trim() !== ''))
        );
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return structuredData.email && emailRegex.test(structuredData.email);
      case 'tel':
      case 'sms':
        const phoneRegex = /^[0-9+\s()-]{5,}$/;
        return structuredData.phone && phoneRegex.test(structuredData.phone);
      case 'vcard':
        return (
          (structuredData.firstName && structuredData.firstName.trim() !== '') ||
          (structuredData.lastName && structuredData.lastName.trim() !== '') ||
          (structuredData.phone && structuredData.phone.trim() !== '') ||
          (structuredData.email && structuredData.email.trim() !== '')
        );
      default:
        return false;
    }
  };

  return (
    <div className="uk-grid uk-grid-medium" data-uk-grid>
      <div className="uk-width-1-1 uk-width-2-3@m">
        <QRCodeForm
          dataType={dataType}
          setDataType={setDataType}
          text={text}
          setText={setText}
          structuredData={structuredData}
          updateStructuredField={updateStructuredField}
          size={size}
          setSize={setSize}
          errorCorrection={errorCorrection}
          setErrorCorrection={setErrorCorrection}
          overlayImage={overlayImage}
          setOverlayImage={setOverlayImage}
          overlaySize={overlaySize}
          setOverlaySize={setOverlaySize}
          autoUpdateFullName={autoUpdateFullName}
          setAutoUpdateFullName={setAutoUpdateFullName}
          handleImageUpload={handleImageUpload}
        />
      </div>
      <div className="uk-width-1-1 uk-width-1-3@m">
        <div className="uk-card uk-card-default uk-card-body">
          <h3 className="uk-card-title">QR Code Preview</h3>
          <div ref={qrRef} className="uk-text-center">
            {isQRCodeEnabled() ? (
              <>
                <QRCodeSVG
                  value={generatedQRValue}
                  size={size}
                  level={errorCorrection}
                  imageSettings={
                    overlayImage
                      ? {
                          src: overlayImage,
                          height: (size * overlaySize) / 100,
                          width: ((size * overlaySize) / 100) * imageAspectRatio,
                          excavate: true,
                        }
                      : undefined
                  }
                />
                {/* QR Code Content Preview */}
                <div className="uk-margin uk-background-muted uk-padding-small uk-border-rounded">
                  <h4 className="uk-text-small uk-text-bold uk-margin-small-bottom">
                    Content Preview:
                  </h4>
                  <div className="uk-overflow-auto uk-text-small" style={{ maxHeight: '150px' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {generatedQRValue}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="uk-placeholder uk-text-center uk-margin-remove">
                Enter data to generate a QR code
              </div>
            )}
          </div>
          <div className="uk-margin-top uk-text-center">
            <button
              className="uk-button uk-button-primary"
              onClick={handleDownload}
              disabled={!isQRCodeEnabled()}
            >
              Download QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
