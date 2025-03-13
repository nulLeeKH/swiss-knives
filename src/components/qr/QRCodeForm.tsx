'use client';

import React from 'react';
import Image from 'next/image';
import FileSelector from './FileSelector';
import {
  QRDataType,
  QRErrorCorrectionLevel,
  ERROR_CORRECTION_DESCRIPTIONS,
  StructuredDataFields,
} from './QRCodeGenerator';

interface QRCodeFormProps {
  dataType: QRDataType;
  setDataType: (type: QRDataType) => void;
  text: string;
  setText: (text: string) => void;
  structuredData: StructuredDataFields;
  updateStructuredField: (field: string, value: string) => void;
  size: number;
  setSize: (size: number) => void;
  errorCorrection: QRErrorCorrectionLevel;
  setErrorCorrection: (level: QRErrorCorrectionLevel) => void;
  overlayImage: string | null;
  setOverlayImage: (image: string | null) => void;
  overlaySize: number;
  setOverlaySize: (size: number) => void;
  autoUpdateFullName: boolean;
  setAutoUpdateFullName: (auto: boolean) => void;
  handleImageUpload: (file: File) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function QRCodeForm({
  dataType,
  setDataType,
  text,
  setText,
  structuredData,
  updateStructuredField,
  size,
  setSize,
  errorCorrection,
  setErrorCorrection,
  overlayImage,
  setOverlayImage,
  overlaySize,
  setOverlaySize,
  autoUpdateFullName,
  setAutoUpdateFullName,
  handleImageUpload,
}: Omit<QRCodeFormProps, 'handleSubmit'>) {
  const renderDataInputFields = () => {
    switch (dataType) {
      case 'text_url':
        return (
          <div className="uk-margin">
            <input
              className="uk-input"
              type="text"
              placeholder="Enter text or URL (e.g., hello world or example.com)"
              value={text}
              onChange={e => setText(e.target.value)}
              aria-label="QR code text or URL"
            />
            <div className="uk-text-small uk-text-muted uk-margin-small-top">
              URLs will be automatically detected and formatted correctly
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="uk-margin">
            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="wifi-ssid">
                Network Name (SSID)
              </label>
              <input
                id="wifi-ssid"
                className="uk-input"
                type="text"
                placeholder="Enter Wi-Fi network name"
                value={structuredData.ssid || ''}
                onChange={e => updateStructuredField('ssid', e.target.value)}
              />
            </div>

            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="wifi-encryption">
                Encryption Type
              </label>
              <select
                id="wifi-encryption"
                className="uk-select"
                value={structuredData.encryption || 'WPA'}
                onChange={e => updateStructuredField('encryption', e.target.value)}
              >
                <option value="WPA">WPA/WPA2/WPA3</option>
                <option value="WEP">WEP</option>
                <option value="none">None</option>
              </select>
            </div>

            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="wifi-password">
                Password
              </label>
              <input
                id="wifi-password"
                className="uk-input"
                type="text"
                placeholder="Enter Wi-Fi password"
                value={structuredData.password || ''}
                onChange={e => updateStructuredField('password', e.target.value)}
                disabled={structuredData.encryption === 'none'}
              />
              {structuredData.encryption === 'none' && (
                <div className="uk-text-small uk-text-muted">
                  No password required for open networks
                </div>
              )}
            </div>

            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="wifi-hidden">
                Hidden Network
              </label>
              <select
                id="wifi-hidden"
                className="uk-select"
                value={
                  typeof structuredData.hidden === 'boolean'
                    ? structuredData.hidden
                      ? 'true'
                      : 'false'
                    : structuredData.hidden || 'false'
                }
                onChange={e => updateStructuredField('hidden', e.target.value)}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="uk-margin">
            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="email-address">
                Email Address
              </label>
              <input
                id="email-address"
                className="uk-input"
                type="email"
                placeholder="Enter email address"
                value={structuredData.email || ''}
                onChange={e => updateStructuredField('email', e.target.value)}
              />
            </div>

            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="email-subject">
                Subject (Optional)
              </label>
              <input
                id="email-subject"
                className="uk-input"
                type="text"
                placeholder="Enter email subject"
                value={structuredData.subject || ''}
                onChange={e => updateStructuredField('subject', e.target.value)}
              />
            </div>

            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="email-body">
                Body (Optional)
              </label>
              <textarea
                id="email-body"
                className="uk-textarea"
                rows={3}
                placeholder="Enter email body"
                value={structuredData.body || ''}
                onChange={e => updateStructuredField('body', e.target.value)}
              />
            </div>
          </div>
        );

      case 'tel':
        return (
          <div className="uk-margin">
            <label className="uk-form-label" htmlFor="tel-number">
              Phone Number
            </label>
            <input
              id="tel-number"
              className="uk-input"
              type="tel"
              placeholder="Enter phone number (e.g., +1234567890)"
              value={structuredData.phone || ''}
              onChange={e => updateStructuredField('phone', e.target.value)}
            />
          </div>
        );

      case 'sms':
        return (
          <div className="uk-margin">
            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="sms-number">
                Phone Number
              </label>
              <input
                id="sms-number"
                className="uk-input"
                type="tel"
                placeholder="Enter phone number (e.g., +1234567890)"
                value={structuredData.phone || ''}
                onChange={e => updateStructuredField('phone', e.target.value)}
              />
            </div>

            <div className="uk-margin-small">
              <label className="uk-form-label" htmlFor="sms-message">
                Message (Optional)
              </label>
              <textarea
                id="sms-message"
                className="uk-textarea"
                rows={3}
                placeholder="Enter SMS message"
                value={structuredData.message || ''}
                onChange={e => updateStructuredField('message', e.target.value)}
              />
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div>
            <h3 className="uk-heading-divider">Contact Information</h3>

            {/* Name Section */}
            <div className="uk-margin">
              <h4 className="uk-heading-bullet">Name Components</h4>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-prefix">
                  Honorific Prefix
                </label>
                <input
                  type="text"
                  id="vcard-prefix"
                  className="uk-input"
                  placeholder="e.g., Dr., Mr., Ms."
                  value={structuredData.prefix || ''}
                  onChange={e => updateStructuredField('prefix', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-firstName">
                  Given Name
                </label>
                <input
                  type="text"
                  id="vcard-firstName"
                  className="uk-input"
                  placeholder="First name"
                  value={structuredData.firstName || ''}
                  onChange={e => updateStructuredField('firstName', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-middleName">
                  Additional Names
                </label>
                <input
                  type="text"
                  id="vcard-middleName"
                  className="uk-input"
                  placeholder="Middle name(s)"
                  value={structuredData.middleName || ''}
                  onChange={e => updateStructuredField('middleName', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-lastName">
                  Family Name
                </label>
                <input
                  type="text"
                  id="vcard-lastName"
                  className="uk-input"
                  placeholder="Last name"
                  value={structuredData.lastName || ''}
                  onChange={e => updateStructuredField('lastName', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-suffix">
                  Honorific Suffix
                </label>
                <input
                  type="text"
                  id="vcard-suffix"
                  className="uk-input"
                  placeholder="e.g., Ph.D., Jr."
                  value={structuredData.suffix || ''}
                  onChange={e => updateStructuredField('suffix', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-fullName">
                  Formatted Name
                </label>
                <div className="uk-flex uk-flex-middle">
                  <input
                    type="text"
                    id="vcard-fullName"
                    className="uk-input"
                    placeholder="Full formatted name"
                    value={structuredData.fullName || ''}
                    onChange={e => {
                      updateStructuredField('fullName', e.target.value);
                      updateStructuredField('manualFullName', 'true');
                    }}
                    disabled={autoUpdateFullName}
                  />
                  <div className="uk-margin-small-left">
                    <label>
                      <input
                        className="uk-checkbox"
                        type="checkbox"
                        checked={autoUpdateFullName}
                        onChange={e => setAutoUpdateFullName(e.target.checked)}
                      />{' '}
                      Auto
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Section */}
            <div className="uk-margin">
              <h4 className="uk-heading-bullet">Organization</h4>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-organization">
                  Organization Name
                </label>
                <input
                  type="text"
                  id="vcard-organization"
                  className="uk-input"
                  placeholder="Organization name"
                  value={structuredData.organization || ''}
                  onChange={e => updateStructuredField('organization', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-title">
                  Title
                </label>
                <input
                  type="text"
                  id="vcard-title"
                  className="uk-input"
                  placeholder="Job title or role"
                  value={structuredData.title || ''}
                  onChange={e => updateStructuredField('title', e.target.value)}
                />
              </div>
            </div>

            {/* Phone Numbers Section */}
            <div className="uk-margin">
              <h4 className="uk-heading-bullet">Phone Numbers</h4>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-phone">
                  Primary Phone
                </label>
                <input
                  type="tel"
                  id="vcard-phone"
                  className="uk-input"
                  placeholder="Primary phone number"
                  value={structuredData.phone || ''}
                  onChange={e => updateStructuredField('phone', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-mobilePhone">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  id="vcard-mobilePhone"
                  className="uk-input"
                  placeholder="Mobile phone number"
                  value={structuredData.mobilePhone || ''}
                  onChange={e => updateStructuredField('mobilePhone', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-workPhone">
                  Work Phone
                </label>
                <input
                  type="tel"
                  id="vcard-workPhone"
                  className="uk-input"
                  placeholder="Work phone number"
                  value={structuredData.workPhone || ''}
                  onChange={e => updateStructuredField('workPhone', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-homePhone">
                  Home Phone
                </label>
                <input
                  type="tel"
                  id="vcard-homePhone"
                  className="uk-input"
                  placeholder="Home phone number"
                  value={structuredData.homePhone || ''}
                  onChange={e => updateStructuredField('homePhone', e.target.value)}
                />
              </div>
            </div>

            {/* Email Addresses Section */}
            <div className="uk-margin">
              <h4 className="uk-heading-bullet">Email Addresses</h4>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-email">
                  Primary Email
                </label>
                <input
                  type="email"
                  id="vcard-email"
                  className="uk-input"
                  placeholder="Primary email address"
                  value={structuredData.email || ''}
                  onChange={e => updateStructuredField('email', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-workEmail">
                  Work Email
                </label>
                <input
                  type="email"
                  id="vcard-workEmail"
                  className="uk-input"
                  placeholder="Work email address"
                  value={structuredData.workEmail || ''}
                  onChange={e => updateStructuredField('workEmail', e.target.value)}
                />
              </div>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-homeEmail">
                  Home Email
                </label>
                <input
                  type="email"
                  id="vcard-homeEmail"
                  className="uk-input"
                  placeholder="Home email address"
                  value={structuredData.homeEmail || ''}
                  onChange={e => updateStructuredField('homeEmail', e.target.value)}
                />
              </div>
            </div>

            {/* Website Section */}
            <div className="uk-margin">
              <h4 className="uk-heading-bullet">Website</h4>

              <div className="uk-margin-small">
                <label className="uk-form-label" htmlFor="vcard-website">
                  Website URL
                </label>
                <input
                  type="url"
                  id="vcard-website"
                  className="uk-input"
                  placeholder="https://example.com"
                  value={structuredData.website || ''}
                  onChange={e => updateStructuredField('website', e.target.value)}
                />
              </div>
            </div>

            {/* Addresses Section */}
            <div className="uk-margin">
              <h4 className="uk-heading-bullet">Addresses</h4>

              {/* Primary Address */}
              <div className="uk-margin-small">
                <h5>Primary Address</h5>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-pobox">
                    P.O. Box
                  </label>
                  <input
                    type="text"
                    id="vcard-pobox"
                    className="uk-input"
                    placeholder="P.O. Box number"
                    value={structuredData.poBox || ''}
                    onChange={e => updateStructuredField('poBox', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-extaddr">
                    Additional Address
                  </label>
                  <input
                    type="text"
                    id="vcard-extaddr"
                    className="uk-input"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    value={structuredData.extAddr || ''}
                    onChange={e => updateStructuredField('extAddr', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-street">
                    Street
                  </label>
                  <input
                    type="text"
                    id="vcard-street"
                    className="uk-input"
                    placeholder="Street address"
                    value={structuredData.street || ''}
                    onChange={e => updateStructuredField('street', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-city">
                    City
                  </label>
                  <input
                    type="text"
                    id="vcard-city"
                    className="uk-input"
                    placeholder="City"
                    value={structuredData.city || ''}
                    onChange={e => updateStructuredField('city', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-state">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="vcard-state"
                    className="uk-input"
                    placeholder="State or province"
                    value={structuredData.state || ''}
                    onChange={e => updateStructuredField('state', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-zip">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="vcard-zip"
                    className="uk-input"
                    placeholder="ZIP or postal code"
                    value={structuredData.zip || ''}
                    onChange={e => updateStructuredField('zip', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-country">
                    Country
                  </label>
                  <input
                    type="text"
                    id="vcard-country"
                    className="uk-input"
                    placeholder="Country"
                    value={structuredData.country || ''}
                    onChange={e => updateStructuredField('country', e.target.value)}
                  />
                </div>
              </div>

              {/* Work Address */}
              <div className="uk-margin-small">
                <h5>Work Address</h5>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-workPoBox">
                    P.O. Box
                  </label>
                  <input
                    type="text"
                    id="vcard-workPoBox"
                    className="uk-input"
                    placeholder="Work P.O. Box number"
                    value={structuredData.workPoBox || ''}
                    onChange={e => updateStructuredField('workPoBox', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-workExtAddr">
                    Additional Address
                  </label>
                  <input
                    type="text"
                    id="vcard-workExtAddr"
                    className="uk-input"
                    placeholder="Work apartment, suite, unit, building, floor, etc."
                    value={structuredData.workExtAddr || ''}
                    onChange={e => updateStructuredField('workExtAddr', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-workStreet">
                    Street
                  </label>
                  <input
                    type="text"
                    id="vcard-workStreet"
                    className="uk-input"
                    placeholder="Work street address"
                    value={structuredData.workStreet || ''}
                    onChange={e => updateStructuredField('workStreet', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-workCity">
                    City
                  </label>
                  <input
                    type="text"
                    id="vcard-workCity"
                    className="uk-input"
                    placeholder="Work city"
                    value={structuredData.workCity || ''}
                    onChange={e => updateStructuredField('workCity', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-workState">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="vcard-workState"
                    className="uk-input"
                    placeholder="Work state or province"
                    value={structuredData.workState || ''}
                    onChange={e => updateStructuredField('workState', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-workZip">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="vcard-workZip"
                    className="uk-input"
                    placeholder="Work ZIP or postal code"
                    value={structuredData.workZip || ''}
                    onChange={e => updateStructuredField('workZip', e.target.value)}
                  />
                </div>
                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-workCountry">
                    Country
                  </label>
                  <input
                    type="text"
                    id="vcard-workCountry"
                    className="uk-input"
                    placeholder="Work country"
                    value={structuredData.workCountry || ''}
                    onChange={e => updateStructuredField('workCountry', e.target.value)}
                  />
                </div>
              </div>

              {/* Home Address */}
              <div className="uk-margin">
                <h4 className="uk-heading-bullet">Home Address</h4>
                <div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-homePoBox">
                      P.O. Box
                    </label>
                    <input
                      type="text"
                      id="vcard-homePoBox"
                      className="uk-input"
                      placeholder="Home P.O. Box number"
                      value={structuredData.homePoBox || ''}
                      onChange={e => updateStructuredField('homePoBox', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-homeExtAddr">
                      Additional Address
                    </label>
                    <input
                      type="text"
                      id="vcard-homeExtAddr"
                      className="uk-input"
                      placeholder="Home apartment, suite, unit, building, floor, etc."
                      value={structuredData.homeExtAddr || ''}
                      onChange={e => updateStructuredField('homeExtAddr', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-homeStreet">
                      Street
                    </label>
                    <input
                      type="text"
                      id="vcard-homeStreet"
                      className="uk-input"
                      placeholder="Home street address"
                      value={structuredData.homeStreet || ''}
                      onChange={e => updateStructuredField('homeStreet', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-homeCity">
                      City
                    </label>
                    <input
                      type="text"
                      id="vcard-homeCity"
                      className="uk-input"
                      placeholder="Home city"
                      value={structuredData.homeCity || ''}
                      onChange={e => updateStructuredField('homeCity', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-homeState">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="vcard-homeState"
                      className="uk-input"
                      placeholder="Home state or province"
                      value={structuredData.homeState || ''}
                      onChange={e => updateStructuredField('homeState', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-homeZip">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="vcard-homeZip"
                      className="uk-input"
                      placeholder="Home ZIP or postal code"
                      value={structuredData.homeZip || ''}
                      onChange={e => updateStructuredField('homeZip', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-homeCountry">
                      Country
                    </label>
                    <input
                      type="text"
                      id="vcard-homeCountry"
                      className="uk-input"
                      placeholder="Home country"
                      value={structuredData.homeCountry || ''}
                      onChange={e => updateStructuredField('homeCountry', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Location Section */}
              <div className="uk-margin">
                <h4 className="uk-heading-bullet">Geographic Location</h4>
                <div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-latitude">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="vcard-latitude"
                      className="uk-input"
                      placeholder="e.g., 37.7749"
                      value={structuredData.latitude || ''}
                      onChange={e => updateStructuredField('latitude', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-longitude">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="vcard-longitude"
                      className="uk-input"
                      placeholder="e.g., -122.4194"
                      value={structuredData.longitude || ''}
                      onChange={e => updateStructuredField('longitude', e.target.value)}
                    />
                  </div>
                  <div className="uk-margin-small">
                    <label className="uk-form-label" htmlFor="vcard-altitude">
                      Altitude (meters)
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="vcard-altitude"
                      className="uk-input"
                      placeholder="e.g., 100"
                      value={structuredData.altitude || ''}
                      onChange={e => updateStructuredField('altitude', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="uk-margin">
                <h4 className="uk-heading-bullet">Additional Information</h4>

                <div className="uk-margin-small">
                  <label className="uk-form-label" htmlFor="vcard-note">
                    Note
                  </label>
                  <textarea
                    id="vcard-note"
                    className="uk-textarea"
                    rows={3}
                    placeholder="Additional notes or information"
                    value={structuredData.note || ''}
                    onChange={e => updateStructuredField('note', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="uk-card uk-card-default uk-card-body uk-box-shadow-small uk-border-rounded">
      <h2 className="uk-card-title uk-margin-bottom">QR Code Generator</h2>

      <div className="uk-child-width-1-1" uk-grid="true">
        <div>
          <div className="uk-card uk-card-default uk-card-body uk-padding-small uk-box-shadow-small uk-border-rounded">
            <h3 className="uk-card-title">QR Code Settings</h3>

            <div className="uk-margin">
              <label className="uk-form-label" htmlFor="qr-data-type">
                Type
              </label>
              <div className="uk-form-controls">
                <select
                  className="uk-select"
                  id="qr-data-type"
                  value={dataType}
                  onChange={e => {
                    setDataType(e.target.value as QRDataType);
                    Object.keys(structuredData).forEach(key => {
                      updateStructuredField(key, '');
                    });
                    setText('');
                  }}
                >
                  <option value="text_url">Text or URL</option>
                  <option value="wifi">Wi-Fi Network</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone Number</option>
                  <option value="sms">SMS</option>
                  <option value="vcard">Contact (vCard)</option>
                </select>
              </div>
            </div>

            {renderDataInputFields()}

            <div className="uk-margin">
              <label className="uk-form-label" htmlFor="qr-size">
                Size (px)
              </label>
              <div className="uk-form-controls">
                <input
                  className="uk-range"
                  id="qr-size"
                  type="range"
                  min="100"
                  max="400"
                  step="10"
                  value={size}
                  onChange={e => setSize(parseInt(e.target.value))}
                />
                <div className="uk-text-right uk-text-small uk-text-muted">{size}px</div>
              </div>
            </div>

            <div className="uk-margin">
              <label className="uk-form-label" htmlFor="qr-error-correction">
                Error Correction
              </label>
              <div className="uk-form-controls">
                <select
                  className="uk-select"
                  id="qr-error-correction"
                  value={errorCorrection}
                  onChange={e => setErrorCorrection(e.target.value as QRErrorCorrectionLevel)}
                >
                  {Object.entries(ERROR_CORRECTION_DESCRIPTIONS).map(([level, description]) => (
                    <option key={level} value={level}>
                      {description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="uk-margin">
              <label className="uk-form-label">Logo Overlay (Optional)</label>
              <div className="uk-form-controls">
                <div className="uk-flex uk-flex-middle uk-flex-wrap">
                  <div className="uk-width-1-1">
                    <FileSelector
                      onFileSelect={(files: File[]) => {
                        if (files.length > 0) {
                          handleImageUpload(files[0]);
                        }
                      }}
                      accept="image/*"
                      buttonText="Select Logo"
                      dropzoneText="Drag & drop a logo or click to select"
                      className="uk-margin-small-bottom"
                      maxSize={2}
                      showPreview={true}
                      multiple={false}
                      validateFile={file => {
                        // Only accept images
                        if (!file.type.startsWith('image/')) {
                          return {
                            isValid: false,
                            errorMessage: 'Please select an image file for the logo',
                          };
                        }
                        return { isValid: true };
                      }}
                    />
                  </div>
                  {overlayImage && (
                    <div className="uk-width-1-1 uk-width-1-3@s uk-flex uk-flex-middle uk-flex-center">
                      {process.env.NODE_ENV === 'test' ? (
                        <Image
                          src={overlayImage}
                          alt="Logo preview"
                          width={60}
                          height={60}
                          style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
                          className="uk-margin-small-right"
                        />
                      ) : (
                        <Image
                          src={overlayImage}
                          alt="Logo preview"
                          width={60}
                          height={60}
                          style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
                          className="uk-margin-small-right"
                        />
                      )}
                      <button
                        className="uk-button uk-button-danger uk-button-small"
                        onClick={() => setOverlayImage(null)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {overlayImage && (
              <div className="uk-margin">
                <label className="uk-form-label" htmlFor="overlay-size">
                  Logo Size (% of QR code)
                </label>
                <div className="uk-form-controls">
                  <input
                    className="uk-range"
                    id="overlay-size"
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={overlaySize}
                    onChange={e => setOverlaySize(parseInt(e.target.value))}
                  />
                  <div className="uk-text-right uk-text-small uk-text-muted">{overlaySize}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
