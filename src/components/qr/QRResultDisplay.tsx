import React, { useState } from 'react';
import { safeParseQRData } from './QRCodeUtils';

export interface QRResultDisplayProps {
  content: string;
  scanMethod?: 'upload' | 'camera';
  onClear?: () => void;
  onGenerate?: () => void;
  isHistory?: boolean;
  timestamp?: number;
  id?: string;
  onDelete?: (id: string) => void;
  onShowAgain?: (content: string) => void;
}

const QRResultDisplay: React.FC<QRResultDisplayProps> = ({
  content,
  scanMethod,
  onClear,
  onGenerate,
  isHistory,
  timestamp,
  id,
  onDelete,
  onShowAgain,
}) => {
  const [isExpanded, setIsExpanded] = useState(!isHistory);
  const parsedResult = safeParseQRData(content, 'text_url');
  const parsedData = parsedResult.parsedData;

  const formatAddress = (address: Record<string, string>, type = '') => {
    const prefix = type ? `${type} ` : '';
    const parts = [];

    const poBox = address[`${type.toLowerCase()}poBox`] || address.poBox;
    const extAddr = address[`${type.toLowerCase()}extAddr`] || address.extAddr;
    const street = address[`${type.toLowerCase()}street`] || address.street;
    const city = address[`${type.toLowerCase()}city`] || address.city;
    const state = address[`${type.toLowerCase()}state`] || address.state;
    const zip = address[`${type.toLowerCase()}zip`] || address.zip;
    const country = address[`${type.toLowerCase()}country`] || address.country;

    if (poBox) parts.push(`P.O. Box ${poBox}`);
    if (extAddr) parts.push(extAddr);
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zip) parts.push(zip);
    if (country) parts.push(country);

    return parts.length > 0 ? `${prefix}${parts.join(', ')}` : '';
  };

  const renderAddressSection = (data: Record<string, string>) => {
    const primaryAddress = formatAddress(data);
    const workAddress = formatAddress(data, 'work');
    const homeAddress = formatAddress(data, 'home');

    return (
      <div className="uk-margin">
        <h4 className="uk-heading-bullet">Addresses</h4>
        {primaryAddress && (
          <div className="uk-margin-small">
            <strong>Primary Address:</strong>
            <div>{primaryAddress}</div>
          </div>
        )}
        {workAddress && (
          <div className="uk-margin-small">
            <strong>Work Address:</strong>
            <div>{workAddress}</div>
          </div>
        )}
        {homeAddress && (
          <div className="uk-margin-small">
            <strong>Home Address:</strong>
            <div>{homeAddress}</div>
          </div>
        )}
      </div>
    );
  };

  const getSummaryContent = (): string => {
    switch (parsedResult.type) {
      case 'tel':
        return parsedData.phone;
      case 'email':
        return parsedData.email;
      case 'wifi':
        return parsedData.ssid;
      case 'vcard':
        if (parsedData.fullName) {
          return parsedData.fullName;
        }
        const nameParts = [
          parsedData.prefix,
          parsedData.firstName,
          parsedData.middleName,
          parsedData.lastName,
          parsedData.suffix,
        ].filter(Boolean);
        const name = nameParts.length > 0 ? nameParts.join(' ') : 'Contact';
        const org = parsedData.organization ? ` (${parsedData.organization})` : '';
        const geo =
          parsedData.latitude && parsedData.longitude
            ? ` [${parsedData.latitude}°, ${parsedData.longitude}°]`
            : '';
        return `${name}${org}${geo}`;
      case 'sms':
        return parsedData.phone;
      case 'text_url':
        return parsedData.text?.substring(0, 30) + (parsedData.text?.length > 30 ? '...' : '');
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={`uk-card uk-card-default uk-card-small uk-box-shadow-small uk-border-rounded ${!isHistory ? 'uk-margin-bottom' : ''}`}
    >
      <div
        className={`uk-card-header uk-padding-small ${isHistory ? 'uk-cursor-pointer' : ''}`}
        onClick={() => isHistory && setIsExpanded(!isExpanded)}
      >
        <div className="uk-flex uk-flex-between uk-flex-middle">
          <div className="uk-flex uk-flex-middle">
            <div className="uk-margin-small-right">
              <span className="uk-label uk-text-capitalize">
                {parsedResult.type ? parsedResult.type.replace('_', ' ') : 'Unknown'}
              </span>
            </div>
            <div className="uk-text-truncate" style={{ maxWidth: '180px' }}>
              {getSummaryContent()}
            </div>
            {isHistory && (
              <span
                className="uk-margin-small-left"
                data-uk-icon={`chevron-${isExpanded ? 'up' : 'down'}`}
              ></span>
            )}
          </div>
          <div className="uk-flex uk-flex-middle">
            {timestamp && (
              <div className="uk-text-small uk-text-muted uk-margin-small-right">
                {new Date(timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
            {scanMethod && (
              <div className="uk-text-small uk-text-muted">
                <span
                  className={`uk-label ${scanMethod === 'camera' ? 'uk-label-success' : 'uk-label-warning'}`}
                >
                  {scanMethod === 'camera' ? 'Camera' : 'Upload'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="uk-card-body uk-padding-small">
          <div className="uk-card uk-card-small uk-card-body uk-padding-small uk-background-muted uk-border-rounded">
            <div className="uk-grid-small" data-uk-grid="">
              <div className="uk-width-auto">
                <div
                  className="uk-background-primary uk-border-circle uk-flex uk-flex-center uk-flex-middle"
                  style={{ width: '40px', height: '40px' }}
                >
                  <span data-uk-icon="icon: user; ratio: 1.2" className="uk-text-white"></span>
                </div>
              </div>
              <div className="uk-width-expand">
                {/* Formatted Name (FN) */}
                {parsedData.fullName && (
                  <div>
                    <h4 className="uk-margin-remove-bottom uk-text-bold">{parsedData.fullName}</h4>
                    <div className="uk-text-small uk-text-muted">
                      <span className="uk-text-bold">Formatted Name</span>
                    </div>
                  </div>
                )}

                {/* Structured Name Components (N) */}
                <div className="uk-margin-small-top">
                  {parsedData.prefix && (
                    <div className="uk-text-small">
                      <span className="uk-text-bold">Honorific Prefix:</span> {parsedData.prefix}
                    </div>
                  )}
                  {parsedData.firstName && (
                    <div className="uk-text-small">
                      <span className="uk-text-bold">Given Name:</span> {parsedData.firstName}
                    </div>
                  )}
                  {parsedData.middleName && (
                    <div className="uk-text-small">
                      <span className="uk-text-bold">Additional Names:</span>{' '}
                      {parsedData.middleName}
                    </div>
                  )}
                  {parsedData.lastName && (
                    <div className="uk-text-small">
                      <span className="uk-text-bold">Family Name:</span> {parsedData.lastName}
                    </div>
                  )}
                  {parsedData.suffix && (
                    <div className="uk-text-small">
                      <span className="uk-text-bold">Honorific Suffix:</span> {parsedData.suffix}
                    </div>
                  )}
                </div>

                {/* Organization Info */}
                {(parsedData.title || parsedData.organization) && (
                  <div className="uk-margin-small-top uk-text-small">
                    {parsedData.organization && (
                      <div>
                        <span className="uk-text-bold">Organization:</span>{' '}
                        {parsedData.organization}
                      </div>
                    )}
                    {parsedData.title && (
                      <div>
                        <span className="uk-text-bold">Title:</span> {parsedData.title}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="uk-margin-small-top">
              {/* Phone Numbers */}
              {(parsedData.phone ||
                parsedData.mobilePhone ||
                parsedData.workPhone ||
                parsedData.homePhone) && (
                <div className="uk-margin-small-bottom">
                  <h5 className="uk-text-bold uk-margin-small-bottom">Phone Numbers</h5>
                  {parsedData.phone && (
                    <div className="uk-flex uk-flex-middle uk-margin-small-bottom">
                      <span
                        data-uk-icon="phone"
                        className="uk-margin-small-right uk-text-primary"
                      ></span>
                      <a href={`tel:${parsedData.phone}`} className="uk-link-text">
                        {parsedData.phone} (Primary)
                      </a>
                    </div>
                  )}
                  {parsedData.mobilePhone && (
                    <div className="uk-flex uk-flex-middle uk-margin-small-bottom">
                      <span
                        data-uk-icon="phone"
                        className="uk-margin-small-right uk-text-primary"
                      ></span>
                      <a href={`tel:${parsedData.mobilePhone}`} className="uk-link-text">
                        {parsedData.mobilePhone} (Mobile)
                      </a>
                    </div>
                  )}
                  {parsedData.workPhone && (
                    <div className="uk-flex uk-flex-middle uk-margin-small-bottom">
                      <span
                        data-uk-icon="receiver"
                        className="uk-margin-small-right uk-text-primary"
                      ></span>
                      <a href={`tel:${parsedData.workPhone}`} className="uk-link-text">
                        {parsedData.workPhone} (Work)
                      </a>
                    </div>
                  )}
                  {parsedData.homePhone && (
                    <div className="uk-flex uk-flex-middle uk-margin-small-bottom">
                      <span
                        data-uk-icon="home"
                        className="uk-margin-small-right uk-text-primary"
                      ></span>
                      <a href={`tel:${parsedData.homePhone}`} className="uk-link-text">
                        {parsedData.homePhone} (Home)
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Email Addresses */}
              {(parsedData.email || parsedData.workEmail || parsedData.homeEmail) && (
                <div className="uk-margin-small-bottom">
                  <h5 className="uk-text-bold uk-margin-small-bottom">Email Addresses</h5>
                  {parsedData.email && (
                    <div className="uk-flex uk-flex-middle uk-margin-small-bottom">
                      <span
                        data-uk-icon="mail"
                        className="uk-margin-small-right uk-text-primary"
                      ></span>
                      <a href={`mailto:${parsedData.email}`} className="uk-link-text">
                        {parsedData.email} (Primary)
                      </a>
                    </div>
                  )}
                  {parsedData.workEmail && (
                    <div className="uk-flex uk-flex-middle uk-margin-small-bottom">
                      <span
                        data-uk-icon="mail"
                        className="uk-margin-small-right uk-text-primary"
                      ></span>
                      <a href={`mailto:${parsedData.workEmail}`} className="uk-link-text">
                        {parsedData.workEmail} (Work)
                      </a>
                    </div>
                  )}
                  {parsedData.homeEmail && (
                    <div className="uk-flex uk-flex-middle uk-margin-small-bottom">
                      <span
                        data-uk-icon="home"
                        className="uk-margin-small-right uk-text-primary"
                      ></span>
                      <a href={`mailto:${parsedData.homeEmail}`} className="uk-link-text">
                        {parsedData.homeEmail} (Home)
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Addresses */}
              {(parsedData.poBox ||
                parsedData.extAddr ||
                parsedData.street ||
                parsedData.workPoBox ||
                parsedData.workExtAddr ||
                parsedData.workStreet ||
                parsedData.homePoBox ||
                parsedData.homeExtAddr ||
                parsedData.homeStreet) &&
                renderAddressSection(parsedData)}

              {/* Geographic Location */}
              {(parsedData.latitude || parsedData.longitude || parsedData.altitude) && (
                <div className="uk-margin-small-bottom">
                  <h4 className="uk-heading-bullet">Geographic Location</h4>
                  {parsedData.latitude && parsedData.longitude && (
                    <div className="uk-margin-small">
                      <strong>Coordinates:</strong> {parsedData.latitude}°, {parsedData.longitude}°
                    </div>
                  )}
                  {parsedData.altitude && (
                    <div className="uk-margin-small">
                      <strong>Altitude:</strong> {parsedData.altitude}m
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              {parsedData.note && (
                <div className="uk-margin-small">
                  <h4 className="uk-heading-bullet">Note</h4>
                  <div>{parsedData.note}</div>
                </div>
              )}
            </div>
          </div>
          <div className="uk-margin-small-top uk-flex uk-flex-right">
            {isHistory ? (
              <>
                {id && onDelete && (
                  <button
                    className="uk-button uk-button-small uk-button-danger uk-margin-small-right"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete(id);
                    }}
                    title="Delete this scan"
                  >
                    <span data-uk-icon="trash" className="uk-margin-small-right"></span>
                    Delete
                  </button>
                )}
                {onShowAgain && (
                  <button
                    className="uk-button uk-button-small uk-button-primary"
                    onClick={e => {
                      e.stopPropagation();
                      onShowAgain(content);
                    }}
                    title="Show scan again"
                  >
                    <span data-uk-icon="history" className="uk-margin-small-right"></span>
                    Show Again
                  </button>
                )}
              </>
            ) : (
              <>
                {onClear && (
                  <button
                    className="uk-button uk-button-small uk-button-danger uk-margin-small-right"
                    onClick={onClear}
                  >
                    <span data-uk-icon="trash" className="uk-margin-small-right"></span>
                    Clear
                  </button>
                )}
                {onGenerate && (
                  <button
                    className="uk-button uk-button-small uk-button-primary"
                    onClick={onGenerate}
                  >
                    <span data-uk-icon="code" className="uk-margin-small-right"></span>
                    Generate
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRResultDisplay;
