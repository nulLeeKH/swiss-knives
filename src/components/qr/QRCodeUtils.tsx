/**
 * Process image data to improve QR code detection
 * Apply adaptive contrast and brightness adjustments to enhance QR code visibility
 */
export const processImageForQRDetection = (imageData: ImageData): ImageData => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return imageData;
  }

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  // Convert to grayscale
  const grayscaleData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = grayscaleData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }

  // Adjust contrast
  const contrast = 1.2; // Increase contrast by 20%
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }

  return grayscaleData;
};

/**
 * Rotate image data by a specified angle
 * @param imageData The image data to rotate
 * @param degrees The rotation angle in degrees
 * @returns The rotated image data
 */
export const rotateImageData = (imageData: ImageData, degrees: number): ImageData => {
  const width = imageData.width;
  const height = imageData.height;

  if (degrees === 0) {
    return imageData;
  }

  // For 90 and 270 degrees, swap width and height
  const newWidth = degrees === 90 || degrees === 270 ? height : width;
  const newHeight = degrees === 90 || degrees === 270 ? width : height;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    return imageData; // If context fails, return original
  }

  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;

  // Draw to off-screen canvas with rotation
  tempCtx.save();
  tempCtx.translate(newWidth / 2, newHeight / 2);
  tempCtx.rotate((degrees * Math.PI) / 180);
  tempCtx.drawImage(imageData as unknown as CanvasImageSource, -width / 2, -height / 2);
  tempCtx.restore();

  // Get rotated image data
  return tempCtx.getImageData(0, 0, newWidth, newHeight);
};

/**
 * Mirror image data horizontally
 * @param data The pixel data to mirror
 * @param width Image width
 * @param height Image height
 * @returns The mirrored pixel data
 */
export const mirrorImageData = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray => {
  const mirrored = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIndex = (y * width + x) * 4;
      const targetIndex = (y * width + (width - 1 - x)) * 4;

      // Copy all 4 channels (R, G, B, A)
      for (let i = 0; i < 4; i++) {
        mirrored[targetIndex + i] = data[sourceIndex + i];
      }
    }
  }

  return mirrored;
};

/**
 * Adjust contrast and brightness of image data
 * @param data The pixel data to adjust
 * @param contrast Contrast adjustment factor
 * @param brightness Brightness adjustment factor
 * @returns The adjusted pixel data
 */
export const adjustImageData = (
  data: Uint8ClampedArray,
  contrast: number,
  brightness: number
): Uint8ClampedArray => {
  const adjusted = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    // Adjust the RGB channels
    for (let j = 0; j < 3; j++) {
      adjusted[i + j] = Math.max(
        0,
        Math.min(255, (data[i + j] - 128) * contrast + 128 + brightness)
      );
    }

    // Keep alpha channel unchanged
    adjusted[i + 3] = data[i + 3];
  }

  return adjusted;
};

import { QRDataType } from './QRCodeGenerator';
import React from 'react';

export interface ScanResultData {
  type: QRDataType;
  parsedData: Record<string, string>;
}

export const safeParseQRData = (
  data: string,
  initialType: QRDataType = 'text_url'
): ScanResultData => {
  try {
    // Try to parse as VCARD
    if (data.trim().toUpperCase().startsWith('BEGIN:VCARD')) {
      const lines = data.split(/\r?\n/);
      const vcardData: Record<string, string> = {};
      const currentKey = '';

      for (const line of lines) {
        if (line.startsWith('END:VCARD')) break;

        // Handle line continuations
        if (line.startsWith(' ') && currentKey) {
          vcardData[currentKey] += line.substring(1);
          continue;
        }

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const [key, ...params] = line.substring(0, colonIndex).split(';');
        const value = line.substring(colonIndex + 1);

        switch (key.toUpperCase()) {
          case 'N':
            const [lastName, firstName, middleName, prefix, suffix] = value.split(';');
            if (lastName) vcardData.lastName = lastName;
            if (firstName) vcardData.firstName = firstName;
            if (middleName) vcardData.middleName = middleName;
            if (prefix) vcardData.prefix = prefix;
            if (suffix) vcardData.suffix = suffix;
            break;
          case 'FN':
            vcardData.fullName = value;
            break;
          case 'ORG':
            vcardData.organization = value;
            break;
          case 'TITLE':
            vcardData.title = value;
            break;
          case 'TEL':
            const telType = params
              .find(p => p.startsWith('TYPE='))
              ?.split('=')[1]
              ?.toUpperCase();
            if (telType === 'CELL' || telType === 'MOBILE') {
              vcardData.mobilePhone = value;
            } else if (telType === 'WORK') {
              vcardData.workPhone = value;
            } else if (telType === 'HOME') {
              vcardData.homePhone = value;
            } else {
              vcardData.phone = value;
            }
            break;
          case 'EMAIL':
            const emailType = params
              .find(p => p.startsWith('TYPE='))
              ?.split('=')[1]
              ?.toUpperCase();
            if (emailType === 'WORK') {
              vcardData.workEmail = value;
            } else if (emailType === 'HOME') {
              vcardData.homeEmail = value;
            } else {
              vcardData.email = value;
            }
            break;
          case 'URL':
            vcardData.website = value;
            break;
          case 'ADR':
            const adrType = params
              .find(p => p.startsWith('TYPE='))
              ?.split('=')[1]
              ?.toUpperCase();
            const [poBox, extAddr, street, city, state, zip, country] = value
              .split(';')
              .map(v => v.trim());

            if (adrType === 'WORK') {
              vcardData.workAddressRaw = value;
              if (poBox) vcardData.workPoBox = poBox;
              if (extAddr) vcardData.workExtAddr = extAddr;
              if (street) vcardData.workStreet = street;
              if (city) vcardData.workCity = city;
              if (state) vcardData.workState = state;
              if (zip) vcardData.workZip = zip;
              if (country) vcardData.workCountry = country;

              // Format complete work address
              const workParts = [];
              if (poBox) workParts.push(`P.O. Box ${poBox}`);
              if (extAddr) workParts.push(extAddr);
              if (street) workParts.push(street);
              if (city) workParts.push(city);
              if (state) workParts.push(state);
              if (zip) workParts.push(zip);
              if (country) workParts.push(country);
              vcardData.workAddress = workParts.join(', ');
            } else if (adrType === 'HOME') {
              vcardData.homeAddressRaw = value;
              if (poBox) vcardData.homePoBox = poBox;
              if (extAddr) vcardData.homeExtAddr = extAddr;
              if (street) vcardData.homeStreet = street;
              if (city) vcardData.homeCity = city;
              if (state) vcardData.homeState = state;
              if (zip) vcardData.homeZip = zip;
              if (country) vcardData.homeCountry = country;

              // Format complete home address
              const homeParts = [];
              if (poBox) homeParts.push(`P.O. Box ${poBox}`);
              if (extAddr) homeParts.push(extAddr);
              if (street) homeParts.push(street);
              if (city) homeParts.push(city);
              if (state) homeParts.push(state);
              if (zip) homeParts.push(zip);
              if (country) homeParts.push(country);
              vcardData.homeAddress = homeParts.join(', ');
            } else {
              vcardData.addressRaw = value;
              if (poBox) vcardData.poBox = poBox;
              if (extAddr) vcardData.extAddr = extAddr;
              if (street) vcardData.street = street;
              if (city) vcardData.city = city;
              if (state) vcardData.state = state;
              if (zip) vcardData.zip = zip;
              if (country) vcardData.country = country;

              // Format complete primary address
              const addressParts = [];
              if (poBox) addressParts.push(`P.O. Box ${poBox}`);
              if (extAddr) addressParts.push(extAddr);
              if (street) addressParts.push(street);
              if (city) addressParts.push(city);
              if (state) addressParts.push(state);
              if (zip) addressParts.push(zip);
              if (country) addressParts.push(country);
              vcardData.address = addressParts.join(', ');
            }
            break;
          case 'NOTE':
            vcardData.note = value;
            break;
          case 'GEO':
            const [lat, lon] = value.split(';');
            if (lat) vcardData.latitude = lat;
            if (lon) vcardData.longitude = lon;
            break;
          case 'X-ALTITUDE':
            vcardData.altitude = value;
            break;
        }
      }

      return { type: 'vcard', parsedData: vcardData };
    }

    // Try to parse as WiFi
    if (data.trim().toUpperCase().startsWith('WIFI:')) {
      const wifiData: Record<string, string> = {};
      const matches = {
        S: /S:([^;]*)/,
        T: /T:([^;]*)/,
        P: /P:([^;]*)/,
        H: /H:([^;]*)/,
      };

      for (const [key, regex] of Object.entries(matches)) {
        const match = data.match(regex);
        if (match) {
          const value = match[1].replace(/\\/g, '');
          switch (key) {
            case 'S':
              wifiData.ssid = value;
              break;
            case 'T':
              wifiData.encryption = value;
              break;
            case 'P':
              wifiData.password = value;
              break;
            case 'H':
              wifiData.hidden = value;
              break;
          }
        }
      }

      return { type: 'wifi', parsedData: wifiData };
    }

    // Try to parse as Email
    if (data.trim().toLowerCase().startsWith('mailto:')) {
      const emailData: Record<string, string> = {};
      const url = new URL(data);
      emailData.email = url.pathname.replace(/^\//, '');
      emailData.subject = url.searchParams.get('subject') || '';
      emailData.body = url.searchParams.get('body') || '';
      return { type: 'email', parsedData: emailData };
    }

    // Try to parse as Phone
    if (data.trim().toLowerCase().startsWith('tel:')) {
      return {
        type: 'tel',
        parsedData: { phone: data.substring(4).trim() },
      };
    }

    // Try to parse as SMS
    if (data.trim().toLowerCase().startsWith('smsto:')) {
      const smsData: Record<string, string> = {};
      const colonIndex = data.indexOf(':', 6);
      if (colonIndex !== -1) {
        smsData.phone = data.substring(6, colonIndex);
        smsData.message = data.substring(colonIndex + 1);
      } else {
        smsData.phone = data.substring(6);
        smsData.message = '';
      }
      return { type: 'sms', parsedData: smsData };
    }

    // Default to text/URL
    return { type: initialType, parsedData: { text: data } };
  } catch (e) {
    console.error('Data parsing error:', e);
    return { type: initialType, parsedData: { text: data } };
  }
};

export const getFormattedContentHTML = (
  type: QRDataType,
  data: Record<string, string>
): React.ReactElement => {
  switch (type) {
    case 'text_url':
      return (
        <div>
          {data.text.match(/^(https?:\/\/)/i) ? (
            <a href={data.text} target="_blank" rel="noopener noreferrer">
              {data.text}
            </a>
          ) : (
            <span>{data.text}</span>
          )}
        </div>
      );

    case 'wifi':
      return (
        <div>
          <p>
            <strong>Network:</strong> {data.ssid}
          </p>
          <p>
            <strong>Encryption:</strong> {data.encryption || 'None'}
          </p>
          {data.password && (
            <p>
              <strong>Password:</strong> {data.password}
            </p>
          )}
          <p>
            <strong>Hidden Network:</strong> {data.hidden === 'true' ? 'Yes' : 'No'}
          </p>
        </div>
      );

    case 'email':
      return (
        <div>
          <p>
            <strong>Email:</strong> {data.email}
          </p>
          {data.subject && (
            <p>
              <strong>Subject:</strong> {data.subject}
            </p>
          )}
          {data.body && (
            <p>
              <strong>Body:</strong> {data.body}
            </p>
          )}
        </div>
      );

    case 'tel':
      return (
        <div>
          <p>
            <strong>Phone:</strong> <a href={`tel:${data.phone}`}>{data.phone}</a>
          </p>
        </div>
      );

    case 'sms':
      return (
        <div>
          <p>
            <strong>Phone:</strong> <a href={`sms:${data.phone}`}>{data.phone}</a>
          </p>
          {data.message && (
            <p>
              <strong>Message:</strong> {data.message}
            </p>
          )}
        </div>
      );

    case 'vcard':
      return (
        <div>
          {data.fullName && (
            <p>
              <strong>Name:</strong> {data.fullName}
            </p>
          )}
          {data.organization && (
            <p>
              <strong>Organization:</strong> {data.organization}
            </p>
          )}
          {data.title && (
            <p>
              <strong>Title:</strong> {data.title}
            </p>
          )}

          {/* Phone numbers */}
          {data.phone && (
            <p>
              <strong>Phone:</strong> <a href={`tel:${data.phone}`}>{data.phone}</a>
            </p>
          )}
          {data.mobilePhone && (
            <p>
              <strong>Mobile:</strong> <a href={`tel:${data.mobilePhone}`}>{data.mobilePhone}</a>
            </p>
          )}
          {data.workPhone && (
            <p>
              <strong>Work Phone:</strong> <a href={`tel:${data.workPhone}`}>{data.workPhone}</a>
            </p>
          )}
          {data.homePhone && (
            <p>
              <strong>Home Phone:</strong> <a href={`tel:${data.homePhone}`}>{data.homePhone}</a>
            </p>
          )}

          {/* Email addresses */}
          {data.email && (
            <p>
              <strong>Email:</strong> <a href={`mailto:${data.email}`}>{data.email}</a>
            </p>
          )}
          {data.workEmail && (
            <p>
              <strong>Work Email:</strong> <a href={`mailto:${data.workEmail}`}>{data.workEmail}</a>
            </p>
          )}
          {data.homeEmail && (
            <p>
              <strong>Home Email:</strong> <a href={`mailto:${data.homeEmail}`}>{data.homeEmail}</a>
            </p>
          )}

          {/* Website */}
          {data.website && (
            <p>
              <strong>Website:</strong>{' '}
              <a
                href={
                  data.website.match(/^(https?:\/\/)/i) ? data.website : `https://${data.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {data.website}
              </a>
            </p>
          )}

          {/* Addresses */}
          {(data.street || data.city || data.state || data.zip || data.country) && (
            <div>
              <p>
                <strong>Address:</strong>
              </p>
              <p className="uk-margin-small-left">
                {data.street && (
                  <>
                    {data.street}
                    <br />
                  </>
                )}
                {data.city && (
                  <>
                    {data.city}
                    {data.state && `, ${data.state}`}
                    <br />
                  </>
                )}
                {data.zip && (
                  <>
                    {data.zip}
                    <br />
                  </>
                )}
                {data.country && <>{data.country}</>}
              </p>
            </div>
          )}

          {(data.workStreet ||
            data.workCity ||
            data.workState ||
            data.workZip ||
            data.workCountry) && (
            <div>
              <p>
                <strong>Work Address:</strong>
              </p>
              <p className="uk-margin-small-left">
                {data.workStreet && (
                  <>
                    {data.workStreet}
                    <br />
                  </>
                )}
                {data.workCity && (
                  <>
                    {data.workCity}
                    {data.workState && `, ${data.workState}`}
                    <br />
                  </>
                )}
                {data.workZip && (
                  <>
                    {data.workZip}
                    <br />
                  </>
                )}
                {data.workCountry && <>{data.workCountry}</>}
              </p>
            </div>
          )}

          {(data.homeStreet ||
            data.homeCity ||
            data.homeState ||
            data.homeZip ||
            data.homeCountry) && (
            <div>
              <p>
                <strong>Home Address:</strong>
              </p>
              <p className="uk-margin-small-left">
                {data.homeStreet && (
                  <>
                    {data.homeStreet}
                    <br />
                  </>
                )}
                {data.homeCity && (
                  <>
                    {data.homeCity}
                    {data.homeState && `, ${data.homeState}`}
                    <br />
                  </>
                )}
                {data.homeZip && (
                  <>
                    {data.homeZip}
                    <br />
                  </>
                )}
                {data.homeCountry && <>{data.homeCountry}</>}
              </p>
            </div>
          )}

          {data.note && (
            <p>
              <strong>Note:</strong> {data.note}
            </p>
          )}

          {/* Geographic Location */}
          {(data.latitude || data.longitude || data.altitude) && (
            <div>
              <p>
                <strong>Geographic Location:</strong>
              </p>
              <p className="uk-margin-small-left">
                {data.latitude && (
                  <>
                    {data.latitude}° N<br />
                  </>
                )}
                {data.longitude && (
                  <>
                    {data.longitude}° E<br />
                  </>
                )}
                {data.altitude && <>{data.altitude}m</>}
              </p>
            </div>
          )}
        </div>
      );

    default:
      return <div>{JSON.stringify(data)}</div>;
  }
};
