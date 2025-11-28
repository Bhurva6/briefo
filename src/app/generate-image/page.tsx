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

export default function GenerateImagePage() {
  const router = useRouter();
  const [editedCopy, setEditedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [department, setDepartment] = useState<string>('');
  const [briefContent, setBriefContent] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const storedCopy = sessionStorage.getItem('editedCopy');
      const storedTemplate = sessionStorage.getItem('selectedTemplate');
      const storedDepartment = sessionStorage.getItem('department');
      const storedBrief = sessionStorage.getItem('briefContent');

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

  const generateForegroundImages = async () => {
    if (!editedCopy || !templateData) return;

    setIsGenerating(true);
    try {
      // Create a comprehensive prompt based on the content
      const heading = editedCopy.hero_headline?.[selectedVariation] || '';
      const subtitle = editedCopy.hero_subheadline?.[selectedVariation] || '';
      
      const prompt = `Create a professional illustration or graphic related to: "${heading}" with subtitle "${subtitle}". 
      Department: ${department}. 
      Context: ${briefContent.substring(0, 200)}...
      Generate a clean, isolated graphic element suitable for a business banner.`;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          department,
          briefContent,
          textContent: `${heading} ${subtitle}`,
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
      console.error('Error generating images:', error);
      alert('Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
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

  useEffect(() => {
    // Auto-generate images when component loads
    if (editedCopy && templateData && generatedImages.length === 0 && !isGenerating) {
      generateForegroundImages();
    }
  }, [editedCopy, templateData]);

  if (!editedCopy || !selectedTemplate || !templateData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading image variations...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-black dark:text-zinc-50">
            Generated Image Variations
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Choose from three different visual variations of your banner
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
          <button
            onClick={generateForegroundImages}
            disabled={isGenerating}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Regenerate Images'}
          </button>
        </div>

        {/* Image Variations */}
        <div className="flex justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl p-8 inline-block">
            <SimpleBannerImageTemplate
              copy={editedCopy}
              variation={selectedVariation}
              template={templateData}
              imageVariation={selectedVariation}
              generatedImages={generatedImages}
            />
            {isGenerating && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Generating foreground images...</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8 space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-md shadow-md hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 transition-colors"
          >
            Back to Preview
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

// Template Component with Image Variations
function SimpleBannerImageTemplate({
  copy,
  variation,
  template,
  imageVariation,
  generatedImages
}: {
  copy: GeneratedCopy;
  variation: number;
  template: any;
  imageVariation: number;
  generatedImages: string[];
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
      {/* Plain background color FFF3D9 */}
      <rect width={canvas.width} height={canvas.height} fill="#FFF3D9" />
      
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
          const lines = wrapText(text, field.max_chars || 100, field.max_lines || 1);
          const lineHeight = field.font?.line_height || field.font?.size + 4 || 20;
          
          return lines.map((line, idx) => (
            <text
              key={`${fieldKey}-${idx}`}
              x={field.position.x}
              y={field.position.y + (idx * lineHeight)}
              fill={field.color}
              fontSize={field.font?.size || 16}
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
