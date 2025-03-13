'use client';

import * as React from 'react';
import { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { QRDataType } from './QRCodeGenerator';
import QRResultDisplay from './QRResultDisplay';
import { ScanResultData, processImageForQRDetection } from './QRCodeUtils';

import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

import FileSelector from './FileSelector';

interface ScanHistoryItem {
  id: string;
  content: string; // Raw QR code content
  timestamp: number;
  scanMethod: 'upload' | 'camera';
}

const SCAN_HISTORY_KEY = 'qr_scanner_history';

export interface QRCodeScannerRef {
  stopCamera: () => void;
  startScanning: () => void;
  stopScanning: () => void;
}

let zxingControlsRef: IScannerControls | null = null;

export type HistoryItem = {
  id: string;
  content: string;
  formattedContent: ScanResultData;
  scanMethod: 'camera' | 'upload';
  timestamp: number;
};

interface QRCodeScannerProps {
  onScan?: (result: string) => void;
  onGenerate?: (type: QRDataType, data: Record<string, string>) => void;
}

const QRCodeScanner = forwardRef<QRCodeScannerRef, QRCodeScannerProps>((props, ref) => {
    // Removed unused variables
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [formattedResult, setFormattedResult] = useState<{
      type: QRDataType;
      parsedData: Record<string, string>;
    } | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasMultipleCameras] = useState(false);
    const [isMirrorMode, setIsMirrorMode] = useState(true);
  const [lastScanMethod, setLastScanMethod] = useState<'camera' | 'upload'>('camera');
    
    const lastScannedCodeRef = useRef<string | null>(null);

    const [history, setHistory] = useState<ScanHistoryItem[]>([]);

    const [storageError, setStorageError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const scanTimerRef = useRef<number | null>(null);

  const recentlyScannedCodes = useRef<{ code: string; timestamp: number }[]>([]);

  const stopCamera = useCallback((): void => {
        if (zxingControlsRef) {
          try {
            zxingControlsRef.stop();
            zxingControlsRef = null;
          } catch (e) {
        console.error('Error stopping ZXing scanner:', e);
          }
        }

        if (scanTimerRef.current) {
          window.clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
        }

    if (stream) {
      try {
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.error('Error stopping stream tracks:', e);
      }
          setStream(null);
        }

    if (videoRef.current) {
          try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
          } catch (e) {
        console.error('Error cleaning up video element:', e);
      }
    }

    setIsCameraActive(false);
    setIsScanning(false);
  }, [stream]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    const handleBeforeUnload = () => {
      stopCamera();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Load history from localStorage
    try {
      const savedHistory = localStorage.getItem(SCAN_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          const validHistory = parsedHistory.filter(
            item =>
              item &&
              typeof item === 'object' &&
              'id' in item &&
              'content' in item &&
              'timestamp' in item &&
              'scanMethod' in item
          );
          setHistory(validHistory);
          console.debug('Loaded history items:', validHistory.length);
        }
      }
      } catch (error) {
      console.error('Error loading scan history:', error);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopCamera();
    };
  }, [stopCamera]);
    
    const addToRecentlyScannedCodes = (code: string) => {
      const now = Date.now();
      recentlyScannedCodes.current.push({ code, timestamp: now });
      
      recentlyScannedCodes.current = recentlyScannedCodes.current.filter(
      item => now - item.timestamp < 5000
      );
      
      if (recentlyScannedCodes.current.length > 10) {
        recentlyScannedCodes.current = recentlyScannedCodes.current.slice(-10);
      }
    };

    /**
     * Check if camera is available and request permissions if needed
     */
    const checkCameraAvailability = async (): Promise<boolean> => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScanError('Camera access is not supported by this browser');
          return false;
        }
        
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true;
      } catch (error) {
      console.error('Camera permission error:', error);

        if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setScanError(
            'Camera access denied. Please allow camera access in your browser settings.'
          );
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setScanError('No camera found on this device.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setScanError('Camera is already in use by another application.');
          } else {
            setScanError(`Cannot access camera: ${error.message}`);
          }
        } else {
        setScanError('Cannot access camera: Unknown error');
        }

        return false;
      }
    };

    /**
     * Initialize ZXing scanner as a fallback method
     */
    const initZXingScanner = async () => {
      try {
        if (!videoRef.current) return;
        
        if (zxingControlsRef) {
          try {
            await zxingControlsRef.stop();
            zxingControlsRef = null;
          } catch (e) {
          console.warn('Error stopping ZXing scanner:', e);
          }
        }
        
        if (!videoRef.current || !videoRef.current.srcObject) {
        console.log('Video element not ready for ZXing initialization');
          return;
        }

      console.log('Starting ZXing initialization...');
        
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);

        const codeReader = new BrowserQRCodeReader(hints);
        
        let initializationStarted = true;

        try {
          zxingControlsRef = await codeReader.decodeFromVideoDevice(
            undefined, 
            videoRef.current,
            (result, error) => {
              if (result && result.getText()) {
                const scanned = result.getText();

              console.log('ZXing QR code found:', scanned);
              console.log('Last scanned code (ref):', lastScannedCodeRef.current);
                
                const normalizedLastCode = lastScannedCodeRef.current?.trim();
                const normalizedCurrentCode = scanned?.trim();
                const isEqual = normalizedLastCode === normalizedCurrentCode;

              console.log('Normalized comparison:', isEqual);
                
                if (isEqual) {
                console.log('Ignoring duplicate scan of the same QR code');
                  return;
                }

              const parsedResult = safeParseQRData(scanned, 'text_url');
                
                setScannedResult(scanned);
                setFormattedResult(parsedResult);
              console.log('Setting lastScannedCode (ref) to:', scanned);
                lastScannedCodeRef.current = scanned; 

              saveToHistory(scanned, 'camera');
                
                addToRecentlyScannedCodes(scanned);
              }
              if (error) {
              }
          }
          );

        console.log('ZXing scanner initialized as fallback');
        } catch (initError) {
        console.error('ZXing initialization error:', initError);
          
          if (initializationStarted) {
            initializationStarted = false;
          }
        }
      } catch (error) {
      console.error('Failed to initialize ZXing scanner:', error);
      }
    };

    /**
     * Start the camera and scanning
     */
    const startCamera = async (): Promise<void> => {
      try {
        if (isScanning) {
        console.log('Camera starting already in progress, ignoring request');
          return;
        }

        setIsScanning(true);
        setScanError(null);
        setScannedResult(null);
        setFormattedResult(null);

      console.log('Starting camera...');
        diagnoseCameraIssues(); 
        
        if (stream) {
          stopCamera();
        await new Promise(resolve => setTimeout(resolve, 500));
        }

      console.log('videoRef exists:', !!videoRef.current);

        if (!videoRef.current) {
        console.error('Cannot find video element. Make sure the component is fully rendered.');
          setIsScanning(false);
        setScanError('Cannot start camera. Please refresh the page.');
          return;
        }
        
        const isCameraAvailable = await checkCameraAvailability();
        if (!isCameraAvailable) {
          setIsScanning(false);
          return;
        }

      console.log('Getting media stream...');

        try {
          const constraints = [
            {
              video: {
              facingMode: 'environment',
              },
            },
            {
            video: true,
              },
          ];

        let mediaStream: MediaStream | null = null;
          const errorMessages = [];
          
          for (const constraint of constraints) {
            try {
            console.log('Trying camera constraints:', JSON.stringify(constraint));
            mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
            console.log('Camera stream acquired with constraints:', JSON.stringify(constraint));
              break;
            } catch (err: unknown) {
            errorMessages.push(err instanceof Error ? err.message : 'Unknown error');
            console.warn('Failed with constraints:', JSON.stringify(constraint), 'Error:', err);
          }
        }
          
          if (!mediaStream) {
            throw new Error(
            `Failed to initialize camera with all constraints. Errors: ${errorMessages.join(', ')}`
            );
          }

        console.log('Media stream acquired successfully');
          
          if (!videoRef.current) {
          console.error('Video element disappeared after getting media stream');
            setIsScanning(false);
          setScanError('Cannot start camera. Please refresh the page.');

          if (mediaStream) {
            mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          }
            return;
          }

        console.log('Setting up video element');
          videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.style.display = 'block';
          
          let videoPlaybackStarted = false;

        console.log('Setting up event listeners');
          
          videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
            if (!videoRef.current || videoPlaybackStarted) return;

            videoRef.current
              .play()
              .then(() => {
                videoPlaybackStarted = true;
              console.log('Video playback started');
                setStream(mediaStream);
                setIsCameraActive(true);

              console.log('Starting QR scanning interval');
                if (scanTimerRef.current) {
                  clearInterval(scanTimerRef.current);
                }
                
                initZXingScanner();

                scanTimerRef.current = window.setInterval(() => {
                  scanVideoFrame();
                }, 200); 
              })
            .catch(error => {
              console.error('Error playing video:', error);
                setScanError(`Video playback error: ${error.message}`);
                setIsScanning(false);

              if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
              }
              });
          };

        videoRef.current.onerror = function () {
          setScanError('Video error occurred');
            setIsScanning(false);

            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
          };
        } catch (error) {
        console.error('Error getting media stream:', error);
          setScanError(
          `Cannot access camera: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          setIsScanning(false);
        }
      } catch (error) {
      console.error('Error starting camera:', error);
        setScanError(
        `Cannot start camera: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setIsScanning(false);
        setIsCameraActive(false);
      }
    };

    /**
     * Scan a single frame from the video and detect QR codes
     * Uses multiple approaches for reliable detection
     */
    const scanVideoFrame = (): void => {
      if (!videoRef.current || !canvasRef.current || !stream) {
        return; 
      }

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video.readyState !== 4) {
          return; 
        }
        
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        canvas.width = videoWidth;
        canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);

      detectQRCode(imageData, ctx, videoWidth, videoHeight);
      } catch (error) {
      console.error('Error scanning video frame:', error);
      }
    };

    /**
     * Detect QR code in the given image data
     * Tries multiple detection approaches for better reliability
     */
    const detectQRCode = (
      imageData: ImageData,
      ctx: CanvasRenderingContext2D,
      videoWidth: number,
    videoHeight: number
  ) => {
    const originalResult = jsQR(imageData.data, imageData.width, imageData.height);
      if (originalResult) {
      processDetectedQRCode(originalResult, ctx, isMirrorMode ? videoWidth : 0);
        return;
      }

    const downsampledImageData = getDownsampledImageData(ctx, videoWidth, videoHeight);
      const downsampledResult = jsQR(
        downsampledImageData.data,
        downsampledImageData.width,
      downsampledImageData.height
      );

      if (downsampledResult) {
      processDetectedQRCode(downsampledResult, ctx, isMirrorMode ? videoWidth : 0);
        return;
      }
      
      const processedImageData = processImageForQRDetection(imageData);
      const processedResult = jsQR(
        processedImageData.data,
        processedImageData.width,
      processedImageData.height
      );

      if (processedResult) {
      processDetectedQRCode(processedResult, ctx, isMirrorMode ? videoWidth : 0);
        return;
      }

    const centerRegionData = extractCenterRegion(ctx, videoWidth, videoHeight);
      if (centerRegionData) {
        const centerResult = jsQR(
          centerRegionData.data,
          centerRegionData.width,
        centerRegionData.height
        );

        if (centerResult) {
        processDetectedQRCode(centerResult, ctx, isMirrorMode ? videoWidth : 0);
          return;
        }
      }
      
      try {
        // No need to store the reference in a variable if we're not using it
        if (videoRef.current && zxingControlsRef) {
          // Empty block but keeping for future implementation
        }
      } catch {
        // Empty catch block but keeping for future implementation
      }
    };

    /**
     * Process detected QR code and update state
     */
    const processDetectedQRCode = (
      code: { 
        data: string; 
        location: {
          topRightCorner: { x: number; y: number };
          topLeftCorner: { x: number; y: number };
          bottomRightCorner: { x: number; y: number };
          bottomLeftCorner: { x: number; y: number };
          topRightFinderPattern: { x: number; y: number };
          topLeftFinderPattern: { x: number; y: number };
          bottomLeftFinderPattern: { x: number; y: number };
          bottomRightAlignmentPattern?: { x: number; y: number };
      };
      },
      ctx: CanvasRenderingContext2D,
    videoWidth: number
    ) => {
      const scanned = code.data;
      
      const normalizedLastCode = lastScannedCodeRef.current?.trim();
      const normalizedCurrentCode = scanned?.trim();
      const isEqual = normalizedLastCode === normalizedCurrentCode;
      
      if (isEqual) {
        return;
      }
      
      drawQRCodeBoundary(ctx, code, isMirrorMode ? videoWidth : 0);
      
      if (canvasRef.current) {
      canvasRef.current.style.opacity = '1';
        setTimeout(() => {
        if (canvasRef.current) canvasRef.current.style.opacity = '1';
        }, 300);
      }

    const parsedResult = safeParseQRData(scanned, 'text_url');
      
      setScannedResult(scanned);
      setFormattedResult(parsedResult);
      lastScannedCodeRef.current = scanned; 

    saveToHistory(scanned, 'camera');
    };

    /**
     * Draw boundaries around detected QR code
     */
    const drawQRCodeBoundary = (
      ctx: CanvasRenderingContext2D,
      code: {
        location: {
          topLeftCorner: { x: number; y: number };
          topRightCorner: { x: number; y: number };
          bottomRightCorner: { x: number; y: number };
          bottomLeftCorner: { x: number; y: number };
        };
      },
    mirrorOffset: number
    ): void => {
      ctx.lineWidth = 4;
    ctx.strokeStyle = '#FF3B58';
      ctx.beginPath();

    const drawLine = (begin: { x: number; y: number }, end: { x: number; y: number }) => {
        if (mirrorOffset) {
          ctx.moveTo(mirrorOffset - begin.x, begin.y);
          ctx.lineTo(mirrorOffset - end.x, end.y);
        } else {
          ctx.moveTo(begin.x, begin.y);
          ctx.lineTo(end.x, end.y);
        }
      };

      drawLine(code.location.topLeftCorner, code.location.topRightCorner);
      drawLine(code.location.topRightCorner, code.location.bottomRightCorner);
      drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner);
      drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner);

      ctx.stroke();
    };

    /**
     * Safely parse QR code data
     */
    const safeParseQRData = (
      data: string,
    initialType: QRDataType
    ): { type: QRDataType; parsedData: Record<string, string> } => {
      try {
      if (typeof data !== 'string' || !data) {
          return {
            type: initialType,
          parsedData: { text: String(data || '') },
          };
        }
        
        let type: QRDataType = initialType;
        let parsedData: Record<string, string> = { text: data };
        
        const safeMatch = (str: string, regex: RegExp): boolean => {
          try {
            const match = str.match(regex);
            return match !== null;
          } catch (error) {
          console.error('Error in regex match:', error);
            return false;
          }
        };
        
        const isURL = safeMatch(data, /^(https?:\/\/)/i);
        if (isURL) {
        return { type: 'text_url', parsedData: { text: data } };
        }

      if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
          console.error('JSON parsing error:', e);
        }
      } else if (data.includes('BEGIN:VCARD')) {
        type = 'vcard';
          const lines = data.split(/\r?\n/);
        const vcardParts: Record<string, string> = {
          rawData: data, // Store raw VCARD data
        };

        let prefix = '';
        let firstName = '';
        let middleName = '';
        let lastName = '';
        let suffix = '';
        let fullName = '';
        let organization = '';
        let title = '';
        let phone = '';
        let workPhone = '';
        let homePhone = '';
        let mobilePhone = '';
        let email = '';
        let workEmail = '';
        let homeEmail = '';
        let website = '';
        let address = '';
        let workAddress = '';
        let homeAddress = '';
        let note = '';

        // Standard address components
        let street = '';
        let city = '';
        let state = '';
        let zip = '';
        let country = '';
        let workStreet = '';
        let workCity = '';
        let workState = '';
        let workZip = '';
        let workCountry = '';
        let homeStreet = '';
        let homeCity = '';
        let homeState = '';
        let homeZip = '';
        let homeCountry = '';

          for (const line of lines) {
          if (line.startsWith('N:')) {
            const nameParts = line.substring(2).split(';');
            lastName = nameParts[0]?.trim() || '';
            firstName = nameParts[1]?.trim() || '';
            middleName = nameParts[2]?.trim() || '';
            prefix = nameParts[3]?.trim() || '';
            suffix = nameParts[4]?.trim() || '';
          } else if (line.startsWith('FN:')) fullName = line.substring(3).trim();
          else if (line.startsWith('ORG:')) organization = line.substring(4).trim();
          else if (line.startsWith('TITLE:')) title = line.substring(6).trim();
          else if (line.startsWith('TEL;')) {
            const value = line.split(':')[1]?.trim();
            if (line.includes('TYPE=WORK')) workPhone = value;
            else if (line.includes('TYPE=HOME')) homePhone = value;
            else if (line.includes('TYPE=CELL') || line.includes('TYPE=MOBILE'))
              mobilePhone = value;
            else if (line.includes('TYPE=PREF')) phone = value;
            else phone = value;
          } else if (line.startsWith('TEL:')) phone = line.substring(4).trim();
          else if (line.startsWith('EMAIL;')) {
            const value = line.split(':')[1]?.trim();
            if (line.includes('TYPE=WORK')) workEmail = value;
            else if (line.includes('TYPE=HOME')) homeEmail = value;
            else if (line.includes('TYPE=PREF')) email = value;
            else email = value;
          } else if (line.startsWith('EMAIL:')) email = line.substring(6).trim();
          else if (line.startsWith('URL:')) website = line.substring(4).trim();
          else if (line.startsWith('ADR;') || line.startsWith('ADR:')) {
            const value = line.startsWith('ADR;') ? line.split(':')[1]?.trim() : line.substring(4);
            const parts = value.split(';');
            // vCard ADR format: PO Box;Extended Address;Street;City;State;ZIP;Country
            const [poBox, extAddr, streetAddr, cityAddr, stateAddr, zipAddr, countryAddr] = parts;

            // Store both raw and formatted address
            const rawParts = [...parts];
            const formattedParts = [];
            if (poBox?.trim()) formattedParts.push(`P.O. Box ${poBox.trim()}`);
            if (extAddr?.trim()) formattedParts.push(extAddr.trim());
            if (streetAddr?.trim()) formattedParts.push(streetAddr.trim());
            if (cityAddr?.trim()) formattedParts.push(cityAddr.trim());
            if (stateAddr?.trim()) formattedParts.push(stateAddr.trim());
            if (zipAddr?.trim()) formattedParts.push(zipAddr.trim());
            if (countryAddr?.trim()) formattedParts.push(countryAddr.trim());

            const formattedAddress = formattedParts.join(', ');

            if (line.includes('TYPE=WORK')) {
              workAddress = formattedAddress;
              vcardParts.workAddressRaw = rawParts.join(';');
              vcardParts.workPoBox = poBox?.trim() || '';
              vcardParts.workExtAddr = extAddr?.trim() || '';
              workStreet = streetAddr?.trim() || '';
              workCity = cityAddr?.trim() || '';
              workState = stateAddr?.trim() || '';
              workZip = zipAddr?.trim() || '';
              workCountry = countryAddr?.trim() || '';
            } else if (line.includes('TYPE=HOME')) {
              homeAddress = formattedAddress;
              vcardParts.homeAddressRaw = rawParts.join(';');
              vcardParts.homePoBox = poBox?.trim() || '';
              vcardParts.homeExtAddr = extAddr?.trim() || '';
              homeStreet = streetAddr?.trim() || '';
              homeCity = cityAddr?.trim() || '';
              homeState = stateAddr?.trim() || '';
              homeZip = zipAddr?.trim() || '';
              homeCountry = countryAddr?.trim() || '';
            } else {
              // Primary address
              address = formattedAddress;
              vcardParts.addressRaw = rawParts.join(';');
              vcardParts.poBox = poBox?.trim() || '';
              vcardParts.extAddr = extAddr?.trim() || '';
              street = streetAddr?.trim() || '';
              city = cityAddr?.trim() || '';
              state = stateAddr?.trim() || '';
              zip = zipAddr?.trim() || '';
              country = countryAddr?.trim() || '';
            }
          } else if (line.startsWith('NOTE:')) note = line.substring(5).trim();
          else if (line.startsWith('GEO:')) {
            const [lat, lon] = line.substring(4).split(';');
            if (lat) vcardParts.latitude = lat.trim();
            if (lon) vcardParts.longitude = lon.trim();
          } else if (line.startsWith('X-ALTITUDE:')) {
            vcardParts.altitude = line.substring(11).trim();
          }
        }

        // Add all fields to vcardParts
        if (prefix) vcardParts.prefix = prefix;
        if (firstName) vcardParts.firstName = firstName;
        if (middleName) vcardParts.middleName = middleName;
        if (lastName) vcardParts.lastName = lastName;
        if (suffix) vcardParts.suffix = suffix;
        if (fullName) vcardParts.fullName = fullName;
          if (organization) vcardParts.organization = organization;
          if (title) vcardParts.title = title;
          if (phone) vcardParts.phone = phone;
        if (workPhone) vcardParts.workPhone = workPhone;
        if (homePhone) vcardParts.homePhone = homePhone;
        if (mobilePhone) vcardParts.mobilePhone = mobilePhone;
          if (email) vcardParts.email = email;
        if (workEmail) vcardParts.workEmail = workEmail;
        if (homeEmail) vcardParts.homeEmail = homeEmail;
          if (website) vcardParts.website = website;
          if (address) vcardParts.address = address;
        if (workAddress) vcardParts.workAddress = workAddress;
        if (homeAddress) vcardParts.homeAddress = homeAddress;
        if (note) vcardParts.note = note;

        // Add individual address components
        if (street) vcardParts.street = street;
        if (city) vcardParts.city = city;
        if (state) vcardParts.state = state;
        if (zip) vcardParts.zip = zip;
        if (country) vcardParts.country = country;
        if (workStreet) vcardParts.workStreet = workStreet;
        if (workCity) vcardParts.workCity = workCity;
        if (workState) vcardParts.workState = workState;
        if (workZip) vcardParts.workZip = workZip;
        if (workCountry) vcardParts.workCountry = workCountry;
        if (homeStreet) vcardParts.homeStreet = homeStreet;
        if (homeCity) vcardParts.homeCity = homeCity;
        if (homeState) vcardParts.homeState = homeState;
        if (homeZip) vcardParts.homeZip = homeZip;
        if (homeCountry) vcardParts.homeCountry = homeCountry;

        parsedData = vcardParts;
      } else if (data.startsWith('WIFI:')) {
        type = 'wifi';
          const parts: Record<string, string> = {};
          const matches = {
            S: /S:(.*?)(;|$)/,
            T: /T:(.*?)(;|$)/,
            P: /P:(.*?)(;|$)/,
            H: /H:(.*?)(;|$)/,
          };

        const getMatchValue = (regex: RegExp, defaultValue = ''): string => {
            const match = data.match(regex);
            return match && match[1] ? match[1] : defaultValue;
          };

          parts.ssid = getMatchValue(matches.S);
        parts.encryption = getMatchValue(matches.T, 'WPA');
          parts.password = getMatchValue(matches.P);
        parts.hidden = getMatchValue(matches.H, 'false');

          parsedData = parts;
      } else if (data.startsWith('mailto:')) {
        type = 'email';
          const parts: Record<string, string> = {};
          const emailPart = data.substring(7);
        const queryIndex = emailPart.indexOf('?');

          if (queryIndex > -1) {
            parts.email = emailPart.substring(0, queryIndex);
            const queryPart = emailPart.substring(queryIndex + 1);
          const queries = queryPart.split('&');

            for (const query of queries) {
            const [key, value] = query.split('=');
            if (key === 'subject') parts.subject = decodeURIComponent(value);
            else if (key === 'body') parts.body = decodeURIComponent(value);
            }
          } else {
            parts.email = emailPart;
          }

          parsedData = parts;
      } else if (data.startsWith('tel:')) {
        type = 'tel';
          parsedData = { phone: data.substring(4) };
      } else if (
        data.startsWith('smsto:') ||
        data.startsWith('sms:') ||
        data.startsWith('SMSTO:') ||
        data.startsWith('SMS:')
      ) {
        type = 'sms';
        const parts: Record<string, string> = {
          rawData: data, // Store raw data
        };
        const smsPart = data.substring(data.toLowerCase().startsWith('smsto:') ? 6 : 4);
        const queryIndex = smsPart.indexOf('?');
        const colonIndex = smsPart.indexOf(':');

        if (colonIndex > -1) {
          // Handle format: smsto:+1234567890:message text or sms:+1234567890:message text
          parts.phone = smsPart.substring(0, colonIndex);
          parts.message = smsPart.substring(colonIndex + 1);
        } else if (queryIndex > -1) {
          // Handle format: smsto:+1234567890?body=message text or sms:+1234567890?body=message text
            parts.phone = smsPart.substring(0, queryIndex);
            const queryPart = smsPart.substring(queryIndex + 1);
          const queries = queryPart.split('&');

            for (const query of queries) {
            const [key, value] = query.split('=');
            if (key === 'body') parts.message = decodeURIComponent(value);
            }
          } else {
          // Handle format: smsto:+1234567890 or sms:+1234567890
            parts.phone = smsPart;
          }

          parsedData = parts;
      } else if (type === 'text_url') {
          if (
            safeMatch(
              data,
            /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/i
            )
          ) {
            parsedData = { text: `https://${data}` };
          } else {
            parsedData = { text: data };
          }
        }

        return { type, parsedData };
      } catch (e) {
      console.error('Data parsing error:', e);
        return { type: initialType, parsedData: { text: data } };
      }
    };

    /**
     * Save QR code scan result to history
     * @param content - Raw QR code content string
     * @param formattedContent - Parsed QR code data
     * @param method - Method used to obtain QR code ('camera' or 'upload')
     */
  const saveToHistory = (content: string, method: 'camera' | 'upload'): void => {
      if (!content) {
      console.debug('Empty content, not saving to history');
        return;
      }

      try {
        const id = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const historyItem: ScanHistoryItem = {
          id,
        content: content,
          timestamp: Date.now(),
        scanMethod: method,
      };

      setHistory(prevHistory => {
        const newHistory = [historyItem, ...prevHistory].slice(0, 100);
        try {
          localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
          console.error('Failed to save history to localStorage:', error);
          setStorageError('Failed to save scan to history.');
        }
        return newHistory;
      });
      setLastScanMethod(method);

      console.debug(`QR code ${method} saved to history with raw content:`, content);
    } catch (error) {
      console.error('Failed to save to history:', error);
      setStorageError('Failed to save scan to history.');
      }
    };

    /**
     * Render scan history
     */
    const renderHistory = () => {
      const storageErrorMessage = storageError && (
        <div className="uk-alert uk-alert-warning uk-margin-bottom uk-border-rounded">
          <p>
          <span data-uk-icon="warning" className="uk-margin-small-right"></span> {storageError}
          </p>
        </div>
      );

      if (history.length === 0) {
        return (
          <>
            {storageErrorMessage}
            <div className="uk-alert uk-alert-primary uk-border-rounded">
              <p>No scan history yet. Scan a QR code to see history here.</p>
            </div>
          </>
        );
      }
      
      const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterday = today - 86400000; 
      const thisWeek = today - 6 * 86400000; 

      const historyByDate = {
        today: [] as ScanHistoryItem[],
        yesterday: [] as ScanHistoryItem[],
        thisWeek: [] as ScanHistoryItem[],
        older: [] as ScanHistoryItem[],
      };

    history.forEach(item => {
      // New validation logic
      if (!item || typeof item !== 'object') {
        console.warn('Invalid history item: not an object', item);
        return;
      }

      if (
        !('id' in item) ||
        !('content' in item) ||
        !('timestamp' in item) ||
        !('scanMethod' in item)
      ) {
        console.warn('Invalid history item: missing required fields', item);
          return;
        }

        if (item.timestamp >= today) {
          historyByDate.today.push(item as ScanHistoryItem);
        } else if (item.timestamp >= yesterday) {
          historyByDate.yesterday.push(item as ScanHistoryItem);
        } else if (item.timestamp >= thisWeek) {
          historyByDate.thisWeek.push(item as ScanHistoryItem);
        } else {
          historyByDate.older.push(item as ScanHistoryItem);
        }
      });

    const renderHistoryItem = (item: ScanHistoryItem) => (
      <QRResultDisplay
        key={item.id}
        content={item.content}
        scanMethod={item.scanMethod}
        timestamp={item.timestamp}
        id={item.id}
        isHistory={true}
        onDelete={id => {
          if (confirm('Delete this scan from history?')) {
            const updatedHistory = history.filter(h => h.id !== id);
            setHistory(updatedHistory);
            try {
              localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));
                          } catch (saveError) {
              console.error('Error saving after delete:', saveError);
              setStorageError('Failed to save changes to storage.');
            }
          }
        }}
        onShowAgain={content => {
          const parsedResult = safeParseQRData(content, 'text_url');
          setScannedResult(content);
                      setFormattedResult(parsedResult);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );

      return (
        <>
          {storageErrorMessage}
          <div className="uk-card uk-card-default uk-border-rounded">
            <div className="uk-card-header uk-padding-small">
              <div className="uk-flex uk-flex-between uk-flex-middle">
                <h3 className="uk-card-title uk-margin-remove">Scan History</h3>
                <div>
                  <button
                    className="uk-button uk-button-danger uk-button-small uk-margin-small-right"
                    onClick={() => {
                    if (confirm('Clear all scan history?')) {
                        setHistory([]);
                        recentlyScannedCodes.current = []; 
                        lastScannedCodeRef.current = null; 
                      console.log('History cleared and lastScannedCodeRef reset to null');
                        try {
                          localStorage.removeItem(SCAN_HISTORY_KEY);
                        localStorage.removeItem(SCAN_HISTORY_KEY + '_last');
                        localStorage.removeItem(SCAN_HISTORY_KEY + '_backup');
                          setStorageError(null);
                        } catch (e) {
                        console.error('Error clearing scan history:', e);
                        setStorageError('Failed to clear history from storage.');
                        }
                      }
                    }}
                    title="Clear all history"
                  >
                  <span data-uk-icon="trash" className="uk-margin-small-right"></span>
                    Clear History
                  </button>
                  <button
                    className="uk-button uk-button-primary uk-button-small"
                    onClick={downloadHistoryAsCSV}
                    title="Download as CSV file"
                  >
                  <span data-uk-icon="download" className="uk-margin-small-right"></span>
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
            <div
              className="uk-card-body uk-padding-small"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
            >
              {/* Today's scans */}
              {historyByDate.today.length > 0 && (
                <div className="uk-margin">
                  <h4 className="uk-heading-divider uk-margin-small">Today</h4>
                  <div>{historyByDate.today.map(renderHistoryItem)}</div>
                </div>
              )}

              {/* Yesterday's scans */}
              {historyByDate.yesterday.length > 0 && (
                <div className="uk-margin">
                <h4 className="uk-heading-divider uk-margin-small">Yesterday</h4>
                  <div>{historyByDate.yesterday.map(renderHistoryItem)}</div>
                </div>
              )}

              {/* This week's scans */}
              {historyByDate.thisWeek.length > 0 && (
                <div className="uk-margin">
                <h4 className="uk-heading-divider uk-margin-small">This Week</h4>
                  <div>{historyByDate.thisWeek.map(renderHistoryItem)}</div>
                </div>
              )}

              {/* Older scans */}
              {historyByDate.older.length > 0 && (
                <div className="uk-margin">
                  <h4 className="uk-heading-divider uk-margin-small">Older</h4>
                  <div>{historyByDate.older.map(renderHistoryItem)}</div>
                </div>
              )}
            </div>
          </div>
        </>
      );
    };

    /**
     * Download history as CSV file
     */
    const downloadHistoryAsCSV = () => {
      if (history.length === 0) return;

    const csvHeader = 'Type,Content,Timestamp,ScanMethod\n';
      const csvContent = history
      .map(item => {
          const timestamp = new Date(item.timestamp).toLocaleString();

        const sanitizedContent = item.content.replace(/\r?\n|\r/g, ' | ').replace(/"/g, '""');
          
          const itemType = (() => {
          if ('type' in item && item.type) {
              return item.type;
            } else if (
            'formattedContent' in item &&
              item.formattedContent &&
            typeof item.formattedContent === 'object' &&
            'type' in item.formattedContent
            ) {
              return item.formattedContent.type;
            }
          return 'text_url';
          })();

          return `"${itemType}","${sanitizedContent}","${timestamp}","${item.scanMethod}"`;
        })
      .join('\n');

      const csvData = csvHeader + csvContent;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
      link.href = url;
    link.setAttribute('download', `qr_scan_history_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    const diagnoseCameraIssues = (): void => {
      if (videoRef.current) {
      console.log('Video Element:', {
          dimensions: `${videoRef.current.width}x${videoRef.current.height}`,
          readyState: videoRef.current.readyState,
          display: window.getComputedStyle(videoRef.current).display,
        playsinline: videoRef.current.getAttribute('playsinline'),
        });
      } else {
      console.log('Video Element: Not found in DOM');
      }

      if (stream) {
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach((track, index) => {
          console.log(`Video Track ${index}:`, {
            active: track.enabled,
            state: track.readyState,
            settings: track.getSettings(),
          });
        });
      } else {
      console.log('MediaStream: Not available');
      }

    console.log('Camera State:', {
        isScanning: isScanning,
        isCameraActive: isCameraActive,
      });
    };
    
    React.useImperativeHandle(ref, () => ({
      stopCamera,
    startScanning: () => {
      setIsScanning(true);
      startCamera();
    },
    stopScanning: () => {
      setIsScanning(false);
      stopCamera();
    },
  }));

  const ResultContainer = ({ children, title }: { children: React.ReactNode; title: string }) => (
      <div className="uk-card uk-card-default uk-border-rounded uk-margin-bottom">
        <div className="uk-card-header uk-padding-small">
        <h3 className="uk-card-title uk-margin-remove uk-text-small">{title}</h3>
        </div>
        <div className="uk-card-body uk-padding-small">{children}</div>
      </div>
    );

    /**
     * Extract downsampled image data for QR detection (better performance)
     */
    const getDownsampledImageData = (
      ctx: CanvasRenderingContext2D,
      videoWidth: number,
    videoHeight: number
    ): ImageData => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        return ctx.getImageData(0, 0, videoWidth, videoHeight);
      }
      
      const scaleFactor = 0.5;
      tempCanvas.width = Math.floor(videoWidth * scaleFactor);
      tempCanvas.height = Math.floor(videoHeight * scaleFactor);

      tempCtx.drawImage(
        ctx.canvas,
        0,
        0,
        videoWidth,
        videoHeight,
        0,
        0,
        tempCanvas.width,
      tempCanvas.height
      );

      return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    };

    /**
     * Extract center region of the image for QR detection (better close-up scanning)
     */
    const extractCenterRegion = (
      ctx: CanvasRenderingContext2D,
      videoWidth: number,
    videoHeight: number
    ): ImageData | null => {
      const centerRegionSize = Math.min(videoWidth, videoHeight) * 0.6;
      const centerX = Math.floor((videoWidth - centerRegionSize) / 2);
      const centerY = Math.floor((videoHeight - centerRegionSize) / 2);

      try {
      return ctx.getImageData(centerX, centerY, centerRegionSize, centerRegionSize);
      } catch {
        // Error extracting center region
        return null;
      }
    };

    /**
     * Process file upload for QR code detection
     */
    const handleFileSelect = async (files: File[]): Promise<void> => {
      if (files.length === 0) {
        return;
      }
      
      const file = files[0];
      
      try {
        setIsScanning(true);
        setScanError(null);
        
        const imageUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

          if (!ctx) {
          setScanError('Could not process image');
            setIsScanning(false);
            URL.revokeObjectURL(imageUrl);
            return;
          }
          
          canvas.width = image.width;
          canvas.height = image.height;
          
          ctx.drawImage(image, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
          });
          
          if (!code) {
            const processedImageData = processImageForQRDetection(imageData);
            code = jsQR(
              processedImageData.data,
              processedImageData.width,
              processedImageData.height,
              {
              inversionAttempts: 'attemptBoth',
            }
            );
          }
          
          URL.revokeObjectURL(imageUrl);
          setIsScanning(false);

          if (code) {
            const scanned = code.data;
            
          const parsedResult = safeParseQRData(scanned, 'text_url');
            
            setScannedResult(scanned);
            setFormattedResult(parsedResult);

          saveToHistory(scanned, 'upload');
          } else {
          setScanError('No QR code found in the image');
          }
        };

        image.onerror = () => {
        setScanError('Failed to load the image');
          setIsScanning(false);
          URL.revokeObjectURL(imageUrl);
        };
        
        image.src = imageUrl;
      } catch (error) {
      console.error('Error processing uploaded file:', error);
      setScanError('Error processing the image');
        setIsScanning(false);
      }
    };

    /**
     * Pause camera temporarily (don't release tracks)
     */
    const pauseCamera = (): void => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.pause();
      }
    };

    /**
     * Switch between cameras
     */
    const switchCamera = async (): Promise<void> => {
      try {
        // Pause current camera before switching
        pauseCamera();
        setIsScanning(true);

        diagnoseCameraIssues(); 
        
        const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length <= 1) {
        setScanError('Only one camera available');
          setIsScanning(false);
          return;
        }

      let currentDeviceId = '';
        if (stream) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
          currentDeviceId = settings.deviceId || '';
          }
        }
        
        let nextDeviceIndex = 0;
        if (currentDeviceId) {
        const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
          if (currentIndex !== -1) {
            nextDeviceIndex = (currentIndex + 1) % videoDevices.length;
          }
        }
        
        stopCamera();

      await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!videoRef.current) {
        setScanError('Video element not found. Please refresh the page.');
          setIsScanning(false);
          return;
        }
        
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: videoDevices[nextDeviceIndex].deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          
          if (!videoRef.current) {
          setScanError('Video element not found. Please refresh the page.');
            setIsScanning(false);

          newStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            return;
          }
          
          videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.style.display = 'block';
          
          videoRef.current.onloadedmetadata = () => {
            if (!videoRef.current) {
              return;
            }

            videoRef.current
              .play()
              .then(() => {
                setStream(newStream);
                setIsCameraActive(true);
                setIsScanning(false);
                
                if (scanTimerRef.current) {
                  clearInterval(scanTimerRef.current);
                }
                
                scanTimerRef.current = window.setInterval(() => {
                  scanVideoFrame();
                }, 200);
              })
            .catch(err => {
                setScanError(
                `Camera playback error: ${err instanceof Error ? err.message : 'Unknown error'}`
                );
                setIsScanning(false);

              newStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
              });
          };

        videoRef.current.onerror = function () {
          setScanError('Video error occurred');
            setIsScanning(false);

            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
          };
        } catch (err: unknown) {
          setScanError(
          `Camera switching error: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
          setIsScanning(false);
          
          setTimeout(() => {
            startCamera();
          }, 1000);
        }
      } catch (error) {
        setScanError(
        `Camera switching failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setIsScanning(false);
      }
    };

    return (
      <div className="uk-card uk-card-default uk-card-body uk-box-shadow-small uk-border-rounded">
      <h2 className="uk-card-title uk-text-small">QR Code Scanner</h2>

        {/* Scanner UI */}
        <div className="uk-margin">
          <div className="uk-grid" data-uk-grid="">
            {/* Camera/Upload Area */}
            <div className="uk-width-1-2@m">
              {/* Camera Preview */}
              <div
                className="uk-inline uk-width-1-1 uk-height-medium uk-background-muted uk-border-rounded uk-flex uk-flex-center uk-flex-middle"
              style={{ position: 'relative', overflow: 'hidden' }}
              >
                {/* Keep video element in DOM but hide when no stream */}
                <video
                  ref={videoRef}
                  className="uk-width-1-1 uk-height-1-1 uk-object-cover uk-border-rounded"
                  playsInline
                  autoPlay
                  muted
                  width="640"
                  height="480"
                  style={{
                  position: 'absolute',
                    left: 0,
                    top: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: stream ? 'block' : 'none',
                    zIndex: 1,
                  backgroundColor: '#000',
                  transform: isMirrorMode ? 'scaleX(-1)' : 'none',
                  }}
                ></video>

                {/* Canvas element stays in DOM */}
                <canvas
                  ref={canvasRef}
                  className="uk-position-absolute uk-position-top-left"
                  style={{
                  width: '100%',
                  height: '100%',
                    opacity: 1,
                  pointerEvents: 'none',
                    zIndex: 2,
                  display: stream ? 'block' : 'none',
                  }}
                ></canvas>

                {/* Status overlay based on current state */}
                {stream ? (
                  <>
                    {/* Simple scanning guide without dark overlay */}
                  <div className="uk-position-absolute uk-position-center" style={{ zIndex: 3 }}>
                      <div
                        style={{
                        width: '200px',
                        height: '200px',
                        border: 'none',
                        borderRadius: '10px',
                        boxShadow: 'none',
                        position: 'relative',
                        }}
                      >
                        <div
                          style={{
                          position: 'absolute',
                            top: 0,
                            left: 0,
                          width: '20px',
                          height: '20px',
                          borderTop: '3px solid rgba(255, 255, 255, 0.9)',
                          borderLeft: '3px solid rgba(255, 255, 255, 0.9)',
                          borderTopLeftRadius: '8px',
                          }}
                        ></div>
                        <div
                          style={{
                          position: 'absolute',
                            top: 0,
                            right: 0,
                          width: '20px',
                          height: '20px',
                          borderTop: '3px solid rgba(255, 255, 255, 0.9)',
                          borderRight: '3px solid rgba(255, 255, 255, 0.9)',
                          borderTopRightRadius: '8px',
                          }}
                        ></div>
                        <div
                          style={{
                          position: 'absolute',
                            bottom: 0,
                            left: 0,
                          width: '20px',
                          height: '20px',
                          borderBottom: '3px solid rgba(255, 255, 255, 0.9)',
                          borderLeft: '3px solid rgba(255, 255, 255, 0.9)',
                          borderBottomLeftRadius: '8px',
                          }}
                        ></div>
                        <div
                          style={{
                          position: 'absolute',
                            bottom: 0,
                            right: 0,
                          width: '20px',
                          height: '20px',
                          borderBottom: '3px solid rgba(255, 255, 255, 0.9)',
                          borderRight: '3px solid rgba(255, 255, 255, 0.9)',
                          borderBottomRightRadius: '8px',
                          }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : isScanning ? (
                <div className="uk-text-center" style={{ position: 'relative', zIndex: 10 }}>
                    <div data-uk-spinner="ratio: 2"></div>
                    <p className="uk-margin-small-top">Connecting camera...</p>
                  </div>
                ) : (
                <div className="uk-text-center" style={{ position: 'relative', zIndex: 10 }}>
                    <p className="uk-margin-small-bottom">
                      <span data-uk-icon="icon: camera; ratio: 2"></span>
                    </p>
                    <p>Camera is off</p>
                  </div>
                )}
              </div>

            {/* Error Message Display */}
            {scanError && (
              <div
                className="uk-alert uk-alert-danger uk-margin-small-top uk-margin-small-bottom"
                style={{ padding: '10px' }}
              >
                <div className="uk-flex uk-flex-middle">
                  <span
                    data-uk-icon="icon: warning; ratio: 0.8"
                    className="uk-margin-small-right"
                  ></span>
                  <p className="uk-margin-remove">{scanError}</p>
                </div>
              </div>
            )}

              {/* Camera Control */}
              <div className="uk-margin-small-top">
                {!stream ? (
                  <button
                    className="uk-button uk-button-primary uk-width-1-1"
                    onClick={() => {
                      setTimeout(() => {
                        if (videoRef.current) {
                          startCamera();
                        } else {
                        console.error('Video element not found even after delay');
                        setScanError('Cannot start camera. Please refresh the page.');
                        }
                      }, 100);
                    }}
                    disabled={isScanning}
                  >
                    <span
                      data-uk-icon="icon: camera; ratio: 0.8"
                      className="uk-margin-small-right"
                    ></span>
                    Start Camera
                  </button>
                ) : (
                  <div className="uk-button-group uk-width-1-1">
                    <button
                    className="uk-button uk-button-default uk-width-1-3 uk-padding-small uk-text-small"
                    style={{ padding: '12px' }}
                      onClick={() => setIsMirrorMode(!isMirrorMode)}
                    >
                    <span data-uk-icon="image"></span> Mirror {isMirrorMode ? 'On' : 'Off'}
                    </button>
                    <button
                    className="uk-button uk-button-primary uk-width-1-3 uk-padding-small uk-text-small"
                    style={{ padding: '12px' }}
                      onClick={() => switchCamera()}
                      disabled={!hasMultipleCameras}
                      title={
                        !hasMultipleCameras
                        ? 'No multiple cameras detected'
                        : 'Switch to different camera'
                      }
                    >
                    <span data-uk-icon="refresh"></span> Flip
                    </button>
                    <button
                    className="uk-button uk-button-danger uk-width-1-3 uk-padding-small uk-text-small"
                    style={{ padding: '12px' }}
                      onClick={() => {
                      console.log('Stop button clicked');
                        stopCamera();
                      }}
                      title="Stop camera"
                    >
                      <span data-uk-icon="close"></span> Stop
                    </button>
                  </div>
                )}
              </div>

              {/* File Upload Section - Alternative method to scan QR codes */}
              <div className="uk-margin-medium-top">
                <div className="uk-card uk-card-default uk-card-body uk-border-rounded">
                <h4 className="uk-heading-line uk-text-center uk-text-small">
                    <span>Or Upload QR Code Image</span>
                  </h4>
                <p className="uk-text-center uk-text-muted uk-text-small">
                  Use this option if you have a QR code image saved on your device
                </p>
                  <FileSelector
                    onFileSelect={handleFileSelect}
                    accept="image/*"
                    buttonText="Select QR Code Image"
                    dropzoneText="Drag & drop a QR code image or click to select"
                    className="uk-width-1-1"
                    maxSize={10}
                    showPreview={true}
                    multiple={false}
                  validateFile={file => {
                      if (!file.type.startsWith('image/')) {
                        return { 
                          isValid: false, 
                        errorMessage: 'Please select an image file',
                        };
                      }
                      return { isValid: true };
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Scan Result Area */}
            <div className="uk-width-1-2@m">
            {scannedResult ? (
              <ResultContainer title="Last Scan">
                <QRResultDisplay
                  content={scannedResult}
                  scanMethod={lastScanMethod}
                  onClear={() => {
                        setScannedResult(null);
                        setFormattedResult(null);
                        lastScannedCodeRef.current = null; 
                  }}
                  onGenerate={() => {
                    if (props.onGenerate && formattedResult) {
                      props.onGenerate(formattedResult.type, formattedResult.parsedData);
                    }
                  }}
                />
              </ResultContainer>
              ) : (
                <div
                  className="uk-alert uk-margin uk-box-shadow-small uk-border-rounded"
                style={{
                  background: '#1e87f0',
                  color: 'white',
                  paddingTop: '15px',
                  paddingBottom: '20px',
                }}
                >
                  <div className="uk-flex uk-flex-middle">
                  <span data-uk-icon="info" className="uk-margin-small-right"></span>
                  <p className="uk-text-small uk-margin-remove">
                    No QR code scanned yet. Use the camera or upload an image to scan a QR code.
                    </p>
                  </div>
                  <ul
                  className="uk-list uk-list-bullet uk-margin-small-top uk-text-small"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    <li>For best results, ensure good lighting</li>
                    <li>Position QR code within the scan area</li>
                    <li>Hold steady to allow for proper scanning</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* History Display Area */}
          <div className="uk-margin-medium-top">{renderHistory()}</div>
        </div>
      </div>
    );
});

QRCodeScanner.displayName = 'QRCodeScanner';

export default QRCodeScanner;
