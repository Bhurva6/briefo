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

export default function PreviewPage() {
  const router = useRouter();
  const [editedCopy, setEditedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [templateData, setTemplateData] = useState<any>(null);

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

        {/* Banner Preview */}
        <div className="flex justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl p-8 inline-block">
            {selectedTemplate?.startsWith('simple_banner_') && templateData && (
              <SimpleBannerTemplate copy={editedCopy} variation={selectedVariation} template={templateData} />
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
            onClick={() => router.push('/generate-image')}
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
function SimpleBannerTemplate({ copy, variation, template }: { copy: GeneratedCopy; variation: number, template: any }) {
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
