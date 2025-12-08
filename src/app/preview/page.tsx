'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface GeneratedCopy {
  hero_headline?: string[];
  hero_subheadline?: string[];
  product_descriptor?: string[];
  benefits?: string[][];
  quick_tip?: string[];
  cta_primary?: string[];
  cta_secondary?: string[];
  leader_closing?: string[];
}

interface FontSettings {
  headingColor: string;
  headingSize: number;
  subtitleColor: string;
  subtitleSize: number;
}

export default function PreviewPage() {
  const router = useRouter();
  const [editedCopy, setEditedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [templateData, setTemplateData] = useState<any>(null);
  
  // Font customization state
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    headingColor: '#1a1a1a',
    headingSize: 48,
    subtitleColor: '#4a4a4a',
    subtitleSize: 24,
  });

  useEffect(() => {
    const loadData = async () => {
      const storedCopy = sessionStorage.getItem('editedCopy') || sessionStorage.getItem('generatedCopy');
      const storedTemplate = sessionStorage.getItem('selectedTemplate');
      
      if (storedCopy) {
        setEditedCopy(JSON.parse(storedCopy));
      }
      if (storedTemplate) {
        setSelectedTemplate(storedTemplate);
        
        // Load template data
        try {
          const templateResponse = await fetch('/templates.json');
          const templateJson = await templateResponse.json();
          const template = templateJson.templates.find((t: any) => t.id === storedTemplate);
          setTemplateData(template);
          
          // Set default font settings from template
          if (template?.fields?.heading) {
            setFontSettings(prev => ({
              ...prev,
              headingColor: template.fields.heading.color || '#1a1a1a',
              headingSize: template.fields.heading.font?.size || 48,
            }));
          }
          if (template?.fields?.subtitle) {
            setFontSettings(prev => ({
              ...prev,
              subtitleColor: template.fields.subtitle.color || '#4a4a4a',
              subtitleSize: template.fields.subtitle.font?.size || 24,
            }));
          }
        } catch (error) {
          console.error('Error loading template:', error);
        }
      }
    };
    
    loadData();
  }, []);

  if (!editedCopy || !selectedTemplate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-black dark:text-zinc-50">
            Banner Preview
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Preview your banner with text placement
          </p>
        </div>

        {/* Variation Selector */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setSelectedVariation(index)}
              className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                selectedVariation === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              Variation {index + 1}
            </button>
          ))}
        </div>

        {/* Font Customization Controls */}
        <div className="max-w-3xl mx-auto mb-8 bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-center mb-4 text-black dark:text-zinc-50">Font Customization</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heading Controls */}
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-700 dark:text-zinc-300">Heading</h4>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-600 dark:text-zinc-400 w-16">Color:</label>
                <input
                  type="color"
                  value={fontSettings.headingColor}
                  onChange={(e) => setFontSettings(prev => ({ ...prev, headingColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-zinc-300"
                />
                <input
                  type="text"
                  value={fontSettings.headingColor}
                  onChange={(e) => setFontSettings(prev => ({ ...prev, headingColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm bg-white dark:bg-zinc-900 text-black dark:text-white"
                  placeholder="#000000"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-600 dark:text-zinc-400 w-16">Size:</label>
                <input
                  type="range"
                  min="24"
                  max="72"
                  value={fontSettings.headingSize}
                  onChange={(e) => setFontSettings(prev => ({ ...prev, headingSize: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12">{fontSettings.headingSize}px</span>
              </div>
            </div>

            {/* Subtitle Controls */}
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-700 dark:text-zinc-300">Subtitle</h4>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-600 dark:text-zinc-400 w-16">Color:</label>
                <input
                  type="color"
                  value={fontSettings.subtitleColor}
                  onChange={(e) => setFontSettings(prev => ({ ...prev, subtitleColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-zinc-300"
                />
                <input
                  type="text"
                  value={fontSettings.subtitleColor}
                  onChange={(e) => setFontSettings(prev => ({ ...prev, subtitleColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm bg-white dark:bg-zinc-900 text-black dark:text-white"
                  placeholder="#000000"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-600 dark:text-zinc-400 w-16">Size:</label>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={fontSettings.subtitleSize}
                  onChange={(e) => setFontSettings(prev => ({ ...prev, subtitleSize: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12">{fontSettings.subtitleSize}px</span>
              </div>
            </div>
          </div>
          
          {/* Quick Color Presets */}
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Quick Presets:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#E2001F', subtitleColor: '#1a1a1a' }))}
                className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Red Heading
              </button>
              <button
                onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#1162A2', subtitleColor: '#1a1a1a' }))}
                className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                Blue Heading
              </button>
              <button
                onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#ffffff', subtitleColor: '#FFFFFF' }))}
                className="px-3 py-1 text-xs rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
              >
                Light Text
              </button>
              <button
                onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#1a1a1a', subtitleColor: '#4a4a4a' }))}
                className="px-3 py-1 text-xs rounded-full bg-zinc-200 text-zinc-700 hover:bg-zinc-300 transition-colors"
              >
                Dark Text
              </button>
            </div>
          </div>
        </div>

        {/* Banner Preview */}
        <div className="flex justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl p-8 inline-block">
            {selectedTemplate?.startsWith('simple_banner_') && templateData && (
              <SimpleBannerTemplate 
                copy={editedCopy} 
                variation={selectedVariation} 
                template={templateData}
                fontSettings={fontSettings}
              />
            )}
          </div>
        </div>

        <div className="text-center mt-8 space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-md shadow-md hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 transition-colors"
          >
            Back to Templates
          </button>
          <button
            onClick={() => {
              // Save font settings to sessionStorage before navigating
              sessionStorage.setItem('fontSettings', JSON.stringify(fontSettings));
              router.push('/generate-image');
            }}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Generate Image
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Start New Project
          </button>
        </div>
      </main>
    </div>
  );
}

// Template Components
function SimpleBannerTemplate({ 
  copy, 
  variation, 
  template,
  fontSettings 
}: { 
  copy: GeneratedCopy; 
  variation: number; 
  template: any;
  fontSettings: FontSettings;
}) {
  const { canvas, background, fields, card } = template;
  
  // Map copy fields to template fields
  const getTextForField = (fieldKey: string) => {
    switch (fieldKey) {
      case 'heading': return copy.hero_headline?.[variation] || 'Your Heading Here';
      case 'subtitle': return copy.hero_subheadline?.[variation] || 'Your subtitle text goes here';
      default: return 'Sample Text';
    }
  };

  // Get custom color for field
  const getColorForField = (fieldKey: string, defaultColor: string) => {
    switch (fieldKey) {
      case 'heading': return fontSettings.headingColor;
      case 'subtitle': return fontSettings.subtitleColor;
      default: return defaultColor;
    }
  };

  // Get custom size for field
  const getSizeForField = (fieldKey: string, defaultSize: number) => {
    switch (fieldKey) {
      case 'heading': return fontSettings.headingSize;
      case 'subtitle': return fontSettings.subtitleSize;
      default: return defaultSize;
    }
  };

  // Wrap text after every 5 words for subtitles
  const wrapTextByWords = (text: string, wordsPerLine: number): string[] => {
    if (!text) return [''];
    const words = text.split(' ');
    const lines: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerLine) {
      const lineWords = words.slice(i, i + wordsPerLine);
      lines.push(lineWords.join(' '));
    }
    
    return lines;
  };

  const wrapText = (text: string, maxChars: number, maxLines: number) => {
    if (!text) return [''];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxChars && lines.length < maxLines) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word.substring(0, maxChars));
          break;
        }
      }
    }
    
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }
    
    return lines.slice(0, maxLines);
  };

  return (
    <svg width={canvas.width} height={canvas.height} viewBox={`0 0 ${canvas.width} ${canvas.height}`} className="border border-zinc-300">
      {/* Background */}
      {background.left_color ? (
        <>
          <rect x="0" y="0" width={background.split_x} height={canvas.height} fill={background.left_color} />
          <rect x={background.split_x} y="0" width={canvas.width - background.split_x} height={canvas.height} fill={background.right_color} />
        </>
      ) : (
        <rect width={canvas.width} height={canvas.height} fill={background.color} />
      )}
      
      {/* Background image placeholder if enabled */}
      {background.image?.enabled && (
        <rect width={canvas.width} height={canvas.height} fill="#cccccc" opacity={background.image.opacity || 1} />
      )}
      
      {/* Card */}
      {card && (
        <rect 
          x={card.position.x} 
          y={card.position.y} 
          width={card.size.width} 
          height={card.size.height} 
          rx={card.radius} 
          fill={card.color} 
        />
      )}
      
      {/* Fields */}
      {Object.keys(fields).map(fieldKey => {
        const field = fields[fieldKey];
        if (field.type === 'text') {
          const text = getTextForField(fieldKey);
          // Use custom font size for line height calculation
          const customSize = getSizeForField(fieldKey, field.font?.size || 16);
          // Use 5-word wrapping for subtitle, regular wrapping for others
          const lines = fieldKey === 'subtitle' 
            ? wrapTextByWords(text, 5)
            : wrapText(text, field.max_chars || 100, field.max_lines || 1);
          const lineHeight = customSize + 8; // Adjust line height based on custom size
          
          return lines.map((line, idx) => (
            <text
              key={`${fieldKey}-${idx}`}
              x={field.position.x}
              y={field.position.y + (idx * lineHeight)}
              fill={getColorForField(fieldKey, field.color)}
              fontSize={customSize}
              fontWeight={field.font?.weight || 400}
              fontFamily="sans-serif"
              textAnchor={field.box && field.box.width ? 'start' : 'middle'}
            >
              {line}
            </text>
          ));
        } else if (field.type === 'image') {
          if (fieldKey === 'logo') {
            // Use the specified logo image
            return (
              <image
                key={fieldKey}
                href="/download.png"
                x={field.position.x}
                y={field.position.y}
                width={field.size.width}
                height={field.size.height}
                preserveAspectRatio="xMidYMid meet"
              />
            );
          } else {
            return (
              <rect
                key={fieldKey}
                x={field.position.x}
                y={field.position.y}
                width={field.size.width}
                height={field.size.height}
                fill="#888888"
                stroke="#666"
                strokeWidth="1"
              />
            );
          }
        }
        return null;
      })}
    </svg>
  );
}
