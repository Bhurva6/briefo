'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2, Download } from 'lucide-react';

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

export default function GenerateImagePage() {
  const router = useRouter();
  const [editedCopy, setEditedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<number>(0);
  const [isGeneratingForeground, setIsGeneratingForeground] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [department, setDepartment] = useState<string>('');
  const [briefContent, setBriefContent] = useState<string>('');
  
  // Custom prompt states
  const [showCustomForeground, setShowCustomForeground] = useState(false);
  const [showCustomBackground, setShowCustomBackground] = useState(false);
  const [customForegroundPrompt, setCustomForegroundPrompt] = useState('');
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState('');
  
  // Font customization state
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    headingColor: '#1a1a1a',
    headingSize: 48,
    subtitleColor: '#4a4a4a',
    subtitleSize: 24,
  });

  // Ref for banner preview for download
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedCopy = sessionStorage.getItem('editedCopy');
      const storedTemplate = sessionStorage.getItem('selectedTemplate');
      const storedDepartment = sessionStorage.getItem('department');
      const storedBrief = sessionStorage.getItem('briefContent');
      const storedFontSettings = sessionStorage.getItem('fontSettings');

      if (storedCopy) {
        setEditedCopy(JSON.parse(storedCopy));
      }
      if (storedFontSettings) {
        setFontSettings(JSON.parse(storedFontSettings));
      }
      if (storedTemplate) {
        setSelectedTemplate(storedTemplate);
        
        // Load template data
        try {
          const templateResponse = await fetch('/templates.json');
          const templateJson = await templateResponse.json();
          const template = templateJson.templates.find((t: any) => t.id === storedTemplate);
          setTemplateData(template);
        } catch (error) {
          console.error('Error loading template:', error);
        }
      }
      if (storedDepartment) {
        setDepartment(storedDepartment);
      }
      if (storedBrief) {
        setBriefContent(storedBrief);
      }
    };

    loadData();
  }, []);

  const generateForegroundImages = async (customPrompt?: string) => {
    if (!editedCopy || !templateData) return;

    setIsGeneratingForeground(true);
    try {
      // Use custom prompt if provided, otherwise use brief-based generation
      const prompt = customPrompt || `Generate a professional illustration for a ${department || 'marketing'} campaign banner based on the marketing brief.`;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          department,
          briefContent: customPrompt ? undefined : briefContent, // Only pass brief if not using custom prompt
          customPrompt: customPrompt || undefined, // Flag for custom prompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate images');
      }

      const data = await response.json();
      
      // Process images to remove backgrounds (simple approach - convert white to transparent)
      const processedImages = await Promise.all(
        data.images.map(async (img: any) => {
          return await removeBackground(img.dataUrl);
        })
      );
      
      setGeneratedImages(processedImages);
    } catch (error) {
      console.error('Error generating foreground images:', error);
      alert('Failed to generate foreground images. Please try again.');
    } finally {
      setIsGeneratingForeground(false);
    }
  };

  const generateBackgroundImages = async (customPrompt?: string) => {
    setIsGeneratingBackground(true);
    try {
      const response = await fetch('/api/generate-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customPrompt: customPrompt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate background images');
      }

      const data = await response.json();
      
      const bgImages = data.images.map((img: any) => img.dataUrl);
      setBackgroundImages(bgImages);
    } catch (error) {
      console.error('Error generating background images:', error);
      alert('Failed to generate background images. Please try again.');
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  const removeBackground = async (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple background removal - make white pixels transparent
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // If pixel is close to white, make it transparent
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // Set alpha to 0
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL());
        } else {
          resolve(imageDataUrl); // Fallback
        }
      };
      img.src = imageDataUrl;
    });
  };

  // Download banner as PNG
  const downloadBanner = async () => {
    if (!bannerRef.current) return;
    
    const svgElement = bannerRef.current.querySelector('svg');
    if (!svgElement) return;

    try {
      // Get SVG dimensions
      const svgWidth = parseInt(svgElement.getAttribute('width') || '1200');
      const svgHeight = parseInt(svgElement.getAttribute('height') || '675');
      
      // Clone SVG and convert images to base64
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Serialize SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create canvas and draw SVG
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);
        
        // Download as PNG
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `bharti-axa-banner-${Date.now()}.png`;
        link.href = pngUrl;
        link.click();
      };
      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading banner:', error);
      alert('Failed to download banner. Please try again.');
    }
  };

  useEffect(() => {
    // Auto-generate images when component loads
    if (editedCopy && templateData && generatedImages.length === 0 && !isGeneratingForeground && !isGeneratingBackground) {
      generateForegroundImages();
      generateBackgroundImages();
    }
  }, [editedCopy, templateData]);

  if (!editedCopy || !selectedTemplate || !templateData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading image variations...</p>
      </div>
    );
  }

  const isGenerating = isGeneratingForeground || isGeneratingBackground;

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black p-8">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Generating Images
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                {isGeneratingForeground && isGeneratingBackground 
                  ? 'Creating foreground and background images...'
                  : isGeneratingForeground 
                    ? 'Creating foreground images...'
                    : 'Creating background images...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-2 text-black dark:text-zinc-50">
            Banner Assembly
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Customize your banner with images and text styling
          </p>
        </div>

        {/* Foreground & Background Selectors */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {/* Foreground Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Foreground:</span>
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setSelectedVariation(index)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  selectedVariation === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => generateForegroundImages()}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↻
            </button>
          </div>

          {/* Background Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Background:</span>
            {['Solid', 'Gradient', 'Accent'].map((style, index) => (
              <button
                key={index}
                onClick={() => setSelectedBackground(index)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  selectedBackground === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300'
                }`}
              >
                {style}
              </button>
            ))}
            <button
              onClick={() => generateBackgroundImages()}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
          
          {/* LEFT PANEL - Create Your Own */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-5 shadow-lg h-fit">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-700 pb-2">
              Create Your Own
            </h3>
            
            {/* Custom Foreground */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowCustomForeground(!showCustomForeground);
                  setShowCustomBackground(false);
                }}
                className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  showCustomForeground
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300'
                }`}
              >
                🎨 Custom Foreground
              </button>
              
              {showCustomForeground && (
                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                    Describe your foreground image (clipart/illustration style)
                  </p>
                  <textarea
                    value={customForegroundPrompt}
                    onChange={(e) => setCustomForegroundPrompt(e.target.value)}
                    placeholder="e.g., A friendly robot waving..."
                    className="w-full p-2 border border-orange-200 dark:border-orange-700 rounded-md text-sm bg-white dark:bg-zinc-900 text-black dark:text-white placeholder:text-zinc-400 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => {
                      if (customForegroundPrompt.trim()) {
                        generateForegroundImages(customForegroundPrompt);
                        setShowCustomForeground(false);
                      }
                    }}
                    disabled={isGenerating || !customForegroundPrompt.trim()}
                    className="mt-2 w-full px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate
                  </button>
                </div>
              )}
            </div>

            {/* Custom Background */}
            <div>
              <button
                onClick={() => {
                  setShowCustomBackground(!showCustomBackground);
                  setShowCustomForeground(false);
                }}
                className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  showCustomBackground
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-300'
                }`}
              >
                🖼️ Custom Background
              </button>
              
              {showCustomBackground && (
                <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-700">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                    Brand colors only: #FFFFFF, #1162A2, #E2001F
                  </p>
                  <textarea
                    value={customBackgroundPrompt}
                    onChange={(e) => setCustomBackgroundPrompt(e.target.value)}
                    placeholder="e.g., Blue gradient with red accents..."
                    className="w-full p-2 border border-teal-200 dark:border-teal-700 rounded-md text-sm bg-white dark:bg-zinc-900 text-black dark:text-white placeholder:text-zinc-400 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => {
                      if (customBackgroundPrompt.trim()) {
                        generateBackgroundImages(customBackgroundPrompt);
                        setShowCustomBackground(false);
                      }
                    }}
                    disabled={isGenerating || !customBackgroundPrompt.trim()}
                    className="mt-2 w-full px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CENTER - Banner Preview */}
          <div className="flex flex-col items-center">
            <div ref={bannerRef} className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl p-6 inline-block">
              <SimpleBannerImageTemplate
                copy={editedCopy}
                variation={selectedVariation}
                template={templateData}
                imageVariation={selectedVariation}
                generatedImages={generatedImages}
                backgroundImage={backgroundImages[selectedBackground] || ''}
                fontSettings={fontSettings}
              />
            </div>
            
            {/* Download Button */}
            <button
              onClick={downloadBanner}
              className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Banner
            </button>
            
            {/* Navigation Buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-5 py-2 bg-zinc-600 text-white font-semibold rounded-md shadow-md hover:bg-zinc-700 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition-colors"
              >
                Start New Project
              </button>
            </div>
          </div>

          {/* RIGHT PANEL - Text Editing */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-5 shadow-lg h-fit">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-700 pb-2">
              Text Styling
            </h3>
            
            {/* Heading Controls */}
            <div className="mb-5">
              <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 mb-3">Heading</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-600 dark:text-zinc-400 w-12">Color</label>
                  <input
                    type="color"
                    value={fontSettings.headingColor}
                    onChange={(e) => setFontSettings(prev => ({ ...prev, headingColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border border-zinc-300"
                  />
                  <input
                    type="text"
                    value={fontSettings.headingColor}
                    onChange={(e) => setFontSettings(prev => ({ ...prev, headingColor: e.target.value }))}
                    className="flex-1 px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded text-xs bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-600 dark:text-zinc-400 w-12">Size</label>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    value={fontSettings.headingSize}
                    onChange={(e) => setFontSettings(prev => ({ ...prev, headingSize: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 w-10">{fontSettings.headingSize}px</span>
                </div>
              </div>
            </div>

            {/* Subtitle Controls */}
            <div className="mb-5">
              <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 mb-3">Subtitle</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-600 dark:text-zinc-400 w-12">Color</label>
                  <input
                    type="color"
                    value={fontSettings.subtitleColor}
                    onChange={(e) => setFontSettings(prev => ({ ...prev, subtitleColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border border-zinc-300"
                  />
                  <input
                    type="text"
                    value={fontSettings.subtitleColor}
                    onChange={(e) => setFontSettings(prev => ({ ...prev, subtitleColor: e.target.value }))}
                    className="flex-1 px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded text-xs bg-white dark:bg-zinc-900 text-black dark:text-white"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-600 dark:text-zinc-400 w-12">Size</label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={fontSettings.subtitleSize}
                    onChange={(e) => setFontSettings(prev => ({ ...prev, subtitleSize: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 w-10">{fontSettings.subtitleSize}px</span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Quick Presets</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#E2001F', subtitleColor: '#1a1a1a' }))}
                  className="px-2 py-1.5 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Red Heading
                </button>
                <button
                  onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#1162A2', subtitleColor: '#1a1a1a' }))}
                  className="px-2 py-1.5 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  Blue Heading
                </button>
                <button
                  onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#ffffff', subtitleColor: '#FFFFFF' }))}
                  className="px-2 py-1.5 text-xs rounded bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
                >
                  Light Text
                </button>
                <button
                  onClick={() => setFontSettings(prev => ({ ...prev, headingColor: '#1a1a1a', subtitleColor: '#4a4a4a' }))}
                  className="px-2 py-1.5 text-xs rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 transition-colors"
                >
                  Dark Text
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Template Component with Image Variations
function SimpleBannerImageTemplate({
  copy,
  variation,
  template,
  imageVariation,
  generatedImages,
  backgroundImage,
  fontSettings
}: {
  copy: GeneratedCopy;
  variation: number;
  template: any;
  imageVariation: number;
  generatedImages: string[];
  backgroundImage: string;
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
      {/* Background - either generated image or fallback color */}
      {backgroundImage ? (
        <image
          href={backgroundImage}
          x="0"
          y="0"
          width={canvas.width}
          height={canvas.height}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <rect width={canvas.width} height={canvas.height} fill="#FFFFFF" />
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
          } else if (fieldKey === 'foreground_image') {
            // Use the generated foreground image for this variation
            const foregroundImage = generatedImages[imageVariation] || '';
            if (foregroundImage) {
              return (
                <image
                  key={fieldKey}
                  href={foregroundImage}
                  x={field.position.x}
                  y={field.position.y}
                  width={field.size.width}
                  height={field.size.height}
                  preserveAspectRatio="xMidYMid meet"
                />
              );
            }
          }
        }
        return null;
      })}
    </svg>
  );
}
