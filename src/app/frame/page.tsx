'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Head from 'next/head';
import type { ColorResult } from 'react-color';

// Dynamic import for SketchPicker with SSR disabled
const SketchPicker = dynamic(
  () => import('react-color').then((mod) => mod.SketchPicker),
  { ssr: false }
);

interface FrameSettings {
  color: string;
  padding: number;
  imageScale: number;
  imageX: number;
  imageY: number;
  text: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  font: {
    family: string;
    size: number;
    weight: number;
    customFont?: string;
  };
  textColor: string;
  frameType: 'square' | 'profile' | 'landscape' | 'portrait';
}

const FRAME_SPECS = {
  square: { width: 1080, height: 1080, label: 'Square Post (1:1)' },
  profile: { width: 360, height: 360, label: 'Profile Photo' },
  landscape: { width: 1080, height: 566, label: 'Landscape (1.91:1)' },
  portrait: { width: 1080, height: 1350, label: 'Portrait (4:5)' },
} as const;

const DEFAULT_SETTINGS: FrameSettings = {
  color: '#000000',
  padding: 9,
  imageScale: 100,
  imageX: 0,
  imageY: 0,
  text: {
    top: '',
    bottom: '',
    left: '',
    right: '',
  },
  font: {
    family: 'Roboto',
    size: 39,
    weight: 700,
  },
  textColor: '#FFFFFF',
  frameType: 'square',
};

// Google Fonts 목록
const GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Playfair Display',
  'Dancing Script',
  'Pacifico',
  'Great Vibes',
  'Sacramento',
  'Satisfy',
  'Lobster',
  'Abril Fatface',
  'Merriweather',
  'Oswald',
  'Raleway',
  'Source Sans Pro',
  'Noto Sans KR',
  'Nanum Gothic',
  'Nanum Myeongjo',
  'Nanum Pen Script'
];

const PreviewCanvas = ({ settings, previewUrl }: { settings: FrameSettings, previewUrl: string | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !FRAME_SPECS[settings.frameType]) return;
      
      const { width, height } = FRAME_SPECS[settings.frameType];
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40; // padding
      const containerHeight = container.clientHeight - 40;
      
      // 화면 크기에 맞게 스케일 조정
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      const newScale = Math.min(scaleX, scaleY, 1); // 최대 1배율로 제한
      
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [settings.frameType]);

  useEffect(() => {
    const renderCanvas = async () => {
      if (!canvasRef.current || !FRAME_SPECS[settings.frameType]) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = FRAME_SPECS[settings.frameType];
      
      // Canvas 크기를 원본 크기로 설정
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 렌더링 품질 향상
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw background
      ctx.fillStyle = settings.color;
      ctx.fillRect(0, 0, width, height);

      // Draw image if exists
      if (previewUrl) {
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = previewUrl;
          });

          const scale = settings.imageScale / 100;
          const paddingX = settings.padding;
          const paddingY = settings.padding;
          const availableWidth = width - (paddingX * 2);
          const availableHeight = height - (paddingY * 2);

          const imgAspectRatio = img.width / img.height;
          let renderWidth = availableWidth * scale;
          let renderHeight = renderWidth / imgAspectRatio;

          if (renderHeight > availableHeight) {
            renderHeight = availableHeight * scale;
            renderWidth = renderHeight * imgAspectRatio;
          }

          const x = paddingX + (availableWidth - renderWidth) / 2 + settings.imageX;
          const y = paddingY + (availableHeight - renderHeight) / 2 + settings.imageY;

          // 이미지 렌더링 품질 향상
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, x, y, renderWidth, renderHeight);
          ctx.restore();
        } catch (err) {
          console.error('Error loading image:', err);
        }
      }

      // Draw text with improved quality
      ctx.textAlign = 'center';
      ctx.fillStyle = settings.textColor;
      ctx.font = `${settings.font.weight} ${settings.font.size}px ${settings.font.family}`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      Object.entries(settings.text).forEach(([position, text]) => {
        if (!text) return;
        
        switch (position) {
          case 'top':
            ctx.fillText(text, width / 2, settings.font.size + 20);
            break;
          case 'bottom':
            ctx.fillText(text, width / 2, height - 20);
            break;
          case 'left':
            ctx.save();
            ctx.translate(20 + settings.font.size, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(text, 0, 0);
            ctx.restore();
            break;
          case 'right':
            ctx.save();
            ctx.translate(width - (20 + settings.font.size), height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(text, 0, 0);
            ctx.restore();
            break;
        }
      });
    };

    renderCanvas();
  }, [settings, previewUrl]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg p-5">
      <canvas
        ref={canvasRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default function FramePage() {
  const [settings, setSettings] = useState<FrameSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('frameSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings) as Partial<FrameSettings>;
          // frameType이 유효한지 확인
          if (!parsed.frameType || !FRAME_SPECS[parsed.frameType as keyof typeof FRAME_SPECS]) {
            parsed.frameType = DEFAULT_SETTINGS.frameType;
          }
          return { ...DEFAULT_SETTINGS, ...parsed } as FrameSettings;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const frameRef = useRef<HTMLDivElement>(null);
  const [customFonts, setCustomFonts] = useState<{ [key: string]: string }>({});
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    // Google Fonts 동적 로드
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS.map(font => font.replace(' ', '+')).join('&family=')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // 설정 저장
  useEffect(() => {
    localStorage.setItem('frameSettings', JSON.stringify(settings));
  }, [settings]);

  // 프리뷰 크기 조정
  useEffect(() => {
    const updatePreviewScale = () => {
      if (previewContainerRef.current && FRAME_SPECS[settings.frameType]) {
        const containerWidth = previewContainerRef.current.offsetWidth - 40; // padding 고려
        const containerHeight = window.innerHeight * 0.6; // 화면 높이의 60%로 제한
        
        const frameWidth = FRAME_SPECS[settings.frameType].width;
        const frameHeight = FRAME_SPECS[settings.frameType].height;
        
        // 가로, 세로 비율 중 더 작은 값을 선택하여 스케일 계산
        const widthScale = containerWidth / frameWidth;
        const heightScale = containerHeight / frameHeight;
        const scale = Math.min(1, widthScale, heightScale);
        
        setPreviewScale(scale);
      }
    };

    updatePreviewScale();
    window.addEventListener('resize', updatePreviewScale);
    return () => window.removeEventListener('resize', updatePreviewScale);
  }, [settings.frameType]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleColorChange = (color: ColorResult) => {
    setSettings(prev => ({ ...prev, color: color.hex }));
  };

  const handleSettingChange = (key: keyof FrameSettings, value: number | number[] | string) => {
    setSettings(prev => ({ ...prev, [key]: Array.isArray(value) ? value[0] : value }));
  };

  const handleTextChange = (position: keyof typeof settings.text, value: string) => {
    setSettings(prev => ({
      ...prev,
      text: { ...prev.text, [position]: value },
    }));
  };

  const handleFontChange = (key: keyof typeof settings.font, value: number | number[] | string) => {
    setSettings(prev => ({
      ...prev,
      font: { ...prev.font, [key]: Array.isArray(value) ? value[0] : value },
    }));
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fontFamily = file.name.replace(/\.[^/.]+$/, "");
        const fontFace = new FontFace(fontFamily, `url(${e.target?.result})`);
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace);
          setCustomFonts(prev => ({
            ...prev,
            [fontFamily]: URL.createObjectURL(file)
          }));
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!FRAME_SPECS[settings.frameType]) return;
    
    try {
      const { width, height } = FRAME_SPECS[settings.frameType];
      
      // Create a new canvas for export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      // Set canvas size to target dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw background
      ctx.fillStyle = settings.color;
      ctx.fillRect(0, 0, width, height);
      
      // Draw image if exists
      if (previewUrl) {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = previewUrl;
        });
        
        const scale = settings.imageScale / 100;
        const paddingX = settings.padding;
        const paddingY = settings.padding;
        const availableWidth = width - (paddingX * 2);
        const availableHeight = height - (paddingY * 2);
        
        const imgAspectRatio = img.width / img.height;
        let renderWidth = availableWidth * scale;
        let renderHeight = renderWidth / imgAspectRatio;
        
        if (renderHeight > availableHeight) {
          renderHeight = availableHeight * scale;
          renderWidth = renderHeight * imgAspectRatio;
        }
        
        const x = paddingX + (availableWidth - renderWidth) / 2 + settings.imageX;
        const y = paddingY + (availableHeight - renderHeight) / 2 + settings.imageY;
        
        ctx.drawImage(img, x, y, renderWidth, renderHeight);
      }
      
      // Draw text
      ctx.textAlign = 'center';
      ctx.fillStyle = settings.textColor;
      ctx.font = `${settings.font.weight} ${settings.font.size}px ${settings.font.family}`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      Object.entries(settings.text).forEach(([position, text]) => {
        if (!text) return;
        
        switch (position) {
          case 'top':
            ctx.fillText(text, width / 2, settings.font.size + 20);
            break;
          case 'bottom':
            ctx.fillText(text, width / 2, height - 20);
            break;
          case 'left':
            ctx.save();
            ctx.translate(20 + settings.font.size, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(text, 0, 0);
            ctx.restore();
            break;
          case 'right':
            ctx.save();
            ctx.translate(width - (20 + settings.font.size), height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(text, 0, 0);
            ctx.restore();
            break;
        }
      });
      
      // Convert to PNG and download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `instagram-${settings.frameType}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  const handleReset = (key?: keyof FrameSettings) => {
    if (key) {
      setSettings(prev => ({ ...prev, [key]: DEFAULT_SETTINGS[key] }));
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  return (
    <>
      <Head>
        <title>Instagram Frame Generator - Digital Swiss Knives</title>
      </Head>
      <div className="uk-container uk-margin-top uk-margin-bottom">
        <h1 className="uk-heading-medium">Instagram Frame Generator</h1>
        
        <div className="uk-grid" data-uk-grid>
          {/* Controls Area */}
          <div className="uk-width-1-3@m uk-flex-first@m">
            <div className="uk-card uk-card-default uk-card-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Frame Type Selection - 최상단으로 이동 */}
              <div className="uk-margin-bottom">
                <h4 className="uk-heading-line"><span>Frame Type</span></h4>
                <select
                  className="uk-select"
                  value={settings.frameType}
                  onChange={(e) => handleSettingChange('frameType', e.target.value as FrameSettings['frameType'])}
                >
                  {Object.entries(FRAME_SPECS).map(([type, spec]) => (
                    <option key={type} value={type}>
                      {spec.label} ({spec.width}x{spec.height})
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Settings Group */}
              <div className="uk-margin-large-bottom">
                <h4 className="uk-heading-line"><span>Image</span></h4>
                
                <div className="uk-margin">
                  <label className="uk-form-label">Upload Image</label>
                  <div className="uk-form-controls">
                    <div className="uk-inline uk-width-1-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="uk-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="uk-margin">
                  <label className="uk-form-label">Scale</label>
                  <div className="uk-flex uk-flex-middle">
                    <div className="uk-width-expand">
                      <Slider
                        min={50}
                        max={200}
                        value={settings.imageScale}
                        onChange={(value) => handleSettingChange('imageScale', value)}
                      />
                    </div>
                    <input
                      type="number"
                      value={settings.imageScale}
                      onChange={(e) => handleSettingChange('imageScale', parseInt(e.target.value) || 50)}
                      className="uk-input uk-margin-small-left"
                      style={{ width: '70px' }}
                    />
                    <span className="uk-margin-small-left">%</span>
                  </div>
                </div>

                <div className="uk-margin">
                  <label className="uk-form-label">Position</label>
                  <div className="uk-grid uk-grid-small" data-uk-grid>
                    <div className="uk-width-1-2">
                      <label className="uk-form-label uk-text-small">X:</label>
                      <input
                        type="number"
                        value={settings.imageX}
                        onChange={(e) => handleSettingChange('imageX', parseInt(e.target.value) || 0)}
                        className="uk-input"
                      />
                    </div>
                    <div className="uk-width-1-2">
                      <label className="uk-form-label uk-text-small">Y:</label>
                      <input
                        type="number"
                        value={settings.imageY}
                        onChange={(e) => handleSettingChange('imageY', parseInt(e.target.value) || 0)}
                        className="uk-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Frame Settings Group */}
              <div className="uk-margin-large-bottom">
                <h4 className="uk-heading-line"><span>Frame</span></h4>
                
                <div className="uk-margin">
                  <label className="uk-form-label">Color</label>
                  <div className="uk-form-controls">
                    {typeof window !== 'undefined' && (
                      <div className="uk-flex uk-flex-middle uk-margin-small-top">
                        <SketchPicker
                          color={settings.color}
                          onChange={handleColorChange}
                          disableAlpha={false}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="uk-margin">
                  <label className="uk-form-label">Padding</label>
                  <div className="uk-flex uk-flex-middle">
                    <div className="uk-width-expand">
                      <Slider
                        min={0}
                        max={50}
                        value={settings.padding}
                        onChange={(value) => handleSettingChange('padding', value)}
                      />
                    </div>
                    <input
                      type="number"
                      value={settings.padding}
                      onChange={(e) => handleSettingChange('padding', parseInt(e.target.value) || 0)}
                      className="uk-input uk-margin-small-left"
                      style={{ width: '70px' }}
                    />
                    <span className="uk-margin-small-left">px</span>
                  </div>
                </div>
              </div>

              {/* Text Settings Group */}
              <div className="uk-margin-large-bottom">
                <h4 className="uk-heading-line"><span>Text</span></h4>
                
                {/* Font Settings */}
                <div className="uk-margin">
                  <label className="uk-form-label">Font Family</label>
                  <select
                    className="uk-select"
                    value={settings.font.family}
                    onChange={(e) => handleFontChange('family', e.target.value)}
                  >
                    {GOOGLE_FONTS.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="uk-margin">
                  <label className="uk-form-label">Font Size</label>
                  <div className="uk-flex uk-flex-middle">
                    <div className="uk-width-expand">
                      <Slider
                        min={8}
                        max={72}
                        value={settings.font.size}
                        onChange={(value) => handleFontChange('size', value)}
                      />
                    </div>
                    <input
                      type="number"
                      value={settings.font.size}
                      onChange={(e) => handleFontChange('size', parseInt(e.target.value) || 8)}
                      className="uk-input uk-margin-small-left"
                      style={{ width: '70px' }}
                    />
                    <span className="uk-margin-small-left">px</span>
                  </div>
                </div>

                <div className="uk-margin">
                  <label className="uk-form-label">Font Weight</label>
                  <select
                    className="uk-select"
                    value={settings.font.weight}
                    onChange={(e) => handleFontChange('weight', parseInt(e.target.value))}
                  >
                    {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(weight => (
                      <option key={weight} value={weight}>
                        {weight}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="uk-margin">
                  <label className="uk-form-label">Text Color</label>
                  <div className="uk-flex uk-flex-middle">
                    <input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => handleSettingChange('textColor', e.target.value)}
                      className="uk-input"
                      style={{ width: '50px', padding: '2px' }}
                    />
                    <input
                      type="text"
                      value={settings.textColor}
                      onChange={(e) => handleSettingChange('textColor', e.target.value)}
                      className="uk-input uk-margin-small-left"
                      style={{ width: '100px' }}
                    />
                  </div>
                </div>

                {/* Text Position Inputs */}
                <div className="uk-margin">
                  <label className="uk-form-label">Text Position</label>
                  <div className="uk-grid uk-grid-small" data-uk-grid>
                    {Object.entries(settings.text).map(([position, text]) => (
                      <div key={position} className="uk-width-1-2">
                        <label className="uk-form-label uk-text-small">
                          {position.charAt(0).toUpperCase() + position.slice(1)}:
                        </label>
                        <input
                          type="text"
                          value={text}
                          onChange={(e) => handleTextChange(position as keyof typeof settings.text, e.target.value)}
                          className="uk-input"
                          placeholder={`${position} text...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="uk-margin">
                <button
                  className="uk-button uk-button-danger uk-width-1-1"
                  onClick={() => handleReset()}
                >
                  Reset All Settings
                </button>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="uk-width-2-3@m">
            <div 
              ref={previewContainerRef}
              style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '60vh',
                backgroundColor: '#f8f8f8',
                padding: '20px',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                ref={frameRef}
                style={{
                  width: FRAME_SPECS[settings.frameType]?.width || FRAME_SPECS.square.width,
                  height: FRAME_SPECS[settings.frameType]?.height || FRAME_SPECS.square.height,
                  backgroundColor: settings.color,
                  padding: settings.padding,
                  position: 'relative',
                  overflow: 'hidden',
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'center',
                  margin: '0 auto',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                }}
              >
                {previewUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      top: settings.padding,
                      left: settings.padding,
                      right: settings.padding,
                      bottom: settings.padding,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        transform: `scale(${settings.imageScale / 100}) translate(${settings.imageX}px, ${settings.imageY}px)`,
                        transformOrigin: 'center',
                      }}
                    />
                  </div>
                )}
                
                {/* Text Overlays */}
                {Object.entries(settings.text).map(([position, text]) => {
                  if (!text) return null;
                  const style: React.CSSProperties = {
                    position: 'absolute',
                    fontFamily: settings.font.family,
                    fontSize: settings.font.size,
                    fontWeight: settings.font.weight,
                    color: settings.textColor,
                    maxWidth: '90%',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  };

                  switch (position) {
                    case 'top':
                      return (
                        <div key={position} style={{ ...style, top: '20px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                          {text}
                        </div>
                      );
                    case 'bottom':
                      return (
                        <div key={position} style={{ ...style, bottom: '20px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                          {text}
                        </div>
                      );
                    case 'left':
                      return (
                        <div
                          key={position}
                          style={{
                            ...style,
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            textAlign: 'left',
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed'
                          }}
                        >
                          {text}
                        </div>
                      );
                    case 'right':
                      return (
                        <div
                          key={position}
                          style={{
                            ...style,
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            textAlign: 'right',
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed'
                          }}
                        >
                          {text}
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
            
            <div className="uk-margin">
              <button
                className="uk-button uk-button-primary uk-width-1-1 uk-button-large"
                onClick={handleDownload}
              >
                Download Image ({FRAME_SPECS[settings.frameType]?.label || FRAME_SPECS.square.label})
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 