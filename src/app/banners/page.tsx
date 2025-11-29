'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name?: string;
  canvas: { width: number; height: number; unit: string };
  background: { 
    color?: string; 
    left_color?: string; 
    right_color?: string; 
    split_x?: number; 
    image?: { enabled: boolean; fit?: string; opacity?: number; side?: string } 
  };
  fields: { [key: string]: any };
  card?: { position: { x: number; y: number }; size: { width: number; height: number }; radius: number; color: string };
}

export default function BannersPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/templates.json');
        const data = await response.json();
        const simpleTemplates = data.templates.map((t: any) => ({
          ...t,
          name: t.name || t.id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        }));
        setTemplates(simpleTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    loadTemplates();
  }, []);

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsGenerating(true);
    // Store selected template
    sessionStorage.setItem('selectedTemplate', templateId);

    // Retrieve stored brief and department
    const briefContent = sessionStorage.getItem('briefContent');
    const department = sessionStorage.getItem('department');

    if (!briefContent || !department) {
      alert('Brief content or department not found. Please start over.');
      router.push('/');
      return;
    }

    // Load template constraints
    const templateResponse = await fetch('/templates.json');
    const templateData = await templateResponse.json();
    const template = templateData.templates.find((t: any) => t.id === templateId);

    if (!template) {
      alert('Template not found.');
      return;
    }

    // Extract max_chars constraints
    const constraints: { [key: string]: any } = {};
    if (template.sections) {
      // For complex templates with sections
      template.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.max_chars) {
            constraints[field.id] = { max_chars: field.max_chars };
          }
          if (field.item_schema) {
            Object.keys(field.item_schema).forEach(key => {
              if (field.item_schema[key].max_chars) {
                constraints[`${field.id}_${key}`] = { max_chars: field.item_schema[key].max_chars };
              }
            });
          }
        });
      });
    } else if (template.fields) {
      // For simple banner templates
      Object.keys(template.fields).forEach(fieldKey => {
        const field = template.fields[fieldKey];
        if (field.max_chars) {
          const constraint: any = { max_chars: field.max_chars };
          // Add word limit for subtitle
          if (fieldKey === 'subtitle') {
            constraint.max_words = 8;
          }
          constraints[fieldKey] = constraint;
        }
      });
    }

    try {
      // Call the API to generate copy
      const response = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefContent,
          department,
          templateConstraints: constraints,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate copy');
      }

      const data = await response.json();
      
      // Store the generated copy in sessionStorage
      sessionStorage.setItem('generatedCopy', JSON.stringify(data.generatedCopy));
      
      // Navigate to generate page
      router.push('/generate');
    } catch (error) {
      console.error('Error generating copy:', error);
      setIsGenerating(false);
      alert(`Failed to generate copy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getScaleFactor = (width: number, height: number) => {
    const maxWidth = 280;
    const maxHeight = 450;
    return Math.min(maxWidth / width, maxHeight / height);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black p-8">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Generating Banner Copy
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Creating copy based on your marketing brief...
              </p>
            </div>
          </div>
        </div>
      )}
      
      <main className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-black dark:text-zinc-50">
            Choose Your Banner Template
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Select a template layout that best fits your needs
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {templates.map((template) => {
            const scale = getScaleFactor(template.canvas.width, template.canvas.height);
            const scaledWidth = template.canvas.width * scale;
            const scaledHeight = template.canvas.height * scale;

            return (
              <div
                key={template.id}
                className="flex flex-col items-center"
              >
                <div className="mb-4 text-center">
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-1">
                    {template.name}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {template.canvas.width} × {template.canvas.height} px
                  </p>
                </div>

                <button
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`relative border-2 rounded-lg overflow-hidden transition-all hover:border-blue-500 hover:shadow-xl ${
                    selectedTemplate === template.id
                      ? 'border-blue-600 shadow-xl'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                  style={{
                    width: `${scaledWidth}px`,
                    height: `${scaledHeight}px`
                  }}
                >
                  {/* Wireframe representation */}
                  <svg
                    width={scaledWidth}
                    height={scaledHeight}
                    viewBox={`0 0 ${template.canvas.width} ${template.canvas.height}`}
                    className="bg-zinc-800"
                  >
                    {template.id.startsWith('simple_banner_') && (
                      <g>
                        {/* Background */}
                        {template.background.left_color && template.background.right_color && template.background.split_x ? (
                          <>
                            <rect x="0" y="0" width={template.background.split_x} height={template.canvas.height} fill={template.background.left_color} stroke="#666" strokeWidth="2"/>
                            <rect x={template.background.split_x} y="0" width={template.canvas.width - template.background.split_x} height={template.canvas.height} fill={template.background.right_color} stroke="#666" strokeWidth="2"/>
                          </>
                        ) : (
                          <rect x="0" y="0" width={template.canvas.width} height={template.canvas.height} fill={template.background.color} stroke="#666" strokeWidth="2"/>
                        )}
                        
                        {/* Card if present */}
                        {template.card && (
                          <rect 
                            x={template.card.position.x} 
                            y={template.card.position.y} 
                            width={template.card.size.width} 
                            height={template.card.size.height} 
                            rx={template.card.radius} 
                            fill={template.card.color} 
                            stroke="#888" 
                            strokeWidth="1"
                          />
                        )}
                        
                        {/* Fields */}
                        {Object.keys(template.fields).map(fieldKey => {
                          const field = template.fields[fieldKey];
                          if (field.type === 'text' && field.box) {
                            return (
                              <rect 
                                key={fieldKey}
                                x={field.position.x} 
                                y={field.position.y} 
                                width={field.box.width} 
                                height={field.box.height} 
                                fill="#5a5a5a" 
                                stroke="#888" 
                                strokeWidth="1"
                              />
                            );
                          } else if (field.type === 'image' && field.size) {
                            return (
                              <rect 
                                key={fieldKey}
                                x={field.position.x} 
                                y={field.position.y} 
                                width={field.size.width} 
                                height={field.size.height} 
                                fill="#6a6a6a" 
                                stroke="#888" 
                                strokeWidth="1"
                              />
                            );
                          }
                          return null;
                        })}
                      </g>
                    )}
                  </svg>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-blue-600/0 hover:bg-blue-600/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold transition-opacity">
                      Select Template
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-md shadow-md hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}
