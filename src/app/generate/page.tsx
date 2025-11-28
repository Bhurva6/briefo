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
  raw_content?: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [department, setDepartment] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [editedCopy, setEditedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const storedCopy = sessionStorage.getItem('generatedCopy');
    const storedDepartment = sessionStorage.getItem('department');
    const storedTemplate = sessionStorage.getItem('selectedTemplate');
    
    if (storedCopy) {
      const parsed = JSON.parse(storedCopy);
      setGeneratedCopy(parsed);
      setEditedCopy(JSON.parse(JSON.stringify(parsed))); // Deep clone
    }
    if (storedDepartment) {
      setDepartment(storedDepartment);
    }
    if (storedTemplate) {
      setSelectedTemplate(storedTemplate);
    }
  }, []);

  const handleTextChange = (field: keyof GeneratedCopy, value: string | string[] | string[][]) => {
    if (editedCopy) {
      setEditedCopy({
        ...editedCopy,
        [field]: value
      });
    }
  };

  const handleBenefitChange = (variantIndex: number, benefitIndex: number, value: string) => {
    if (editedCopy?.benefits) {
      const newBenefits = JSON.parse(JSON.stringify(editedCopy.benefits));
      newBenefits[variantIndex][benefitIndex] = value;
      setEditedCopy({
        ...editedCopy,
        benefits: newBenefits
      });
    }
  };

  const handleNext = () => {
    // Save edited copy to sessionStorage
    sessionStorage.setItem('editedCopy', JSON.stringify(editedCopy));
    router.push('/preview');
  };

  if (!generatedCopy || !editedCopy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading generated copy...</p>
      </div>
    );
  }

  // If raw content exists (parsing failed), display it differently
  if (generatedCopy.raw_content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
        <main className="w-full max-w-4xl bg-white dark:bg-black p-8 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold text-center mb-4 text-black dark:text-zinc-50">
            Generated Marketing Copy
          </h1>
          <p className="text-center text-red-600 dark:text-red-400 mb-8">
            Note: The API returned content that couldn't be parsed into the expected format.
          </p>
          <div className="max-w-none bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg overflow-auto">
            <div className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200 wrap-break-word">
              {generatedCopy.raw_content}
            </div>
          </div>
          <div className="text-center mt-8 space-x-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedCopy.raw_content || '');
                alert('Copied to clipboard!');
              }}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Copy to Clipboard
            </button>
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

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-black dark:text-zinc-50">
            Generated Banner Copies
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Department: <span className="font-semibold capitalize">{department}</span>
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

        {/* Generated Copy Sections */}
        <div className="grid grid-cols-1 gap-6">
          {/* Heading */}
          {editedCopy.hero_headline && editedCopy.hero_headline[selectedVariation] && (
            <div className="p-6 border border-zinc-300 rounded-lg shadow-sm bg-white dark:bg-zinc-800 dark:border-zinc-600">
              <h2 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Heading</h2>
              <textarea
                value={editedCopy.hero_headline[selectedVariation]}
                onChange={(e) => {
                  const newHeadlines = [...editedCopy.hero_headline!];
                  newHeadlines[selectedVariation] = e.target.value;
                  handleTextChange('hero_headline', newHeadlines);
                }}
                className="w-full text-2xl font-bold text-black dark:text-zinc-50 bg-transparent border border-transparent hover:border-zinc-300 focus:border-blue-500 focus:outline-none rounded p-2 min-h-16 resize-none"
              />
            </div>
          )}

          {/* Subtitle */}
          {editedCopy.hero_subheadline && editedCopy.hero_subheadline[selectedVariation] && (
            <div className="p-6 border border-zinc-300 rounded-lg shadow-sm bg-white dark:bg-zinc-800 dark:border-zinc-600">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Subtitle</h2>
                <span className={`text-sm ${editedCopy.hero_subheadline[selectedVariation].split(' ').filter(word => word.length > 0).length > 8 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {editedCopy.hero_subheadline[selectedVariation].split(' ').filter(word => word.length > 0).length}/8 words
                </span>
              </div>
              <textarea
                value={editedCopy.hero_subheadline[selectedVariation]}
                onChange={(e) => {
                  const words = e.target.value.split(' ').filter(word => word.length > 0);
                  if (words.length <= 8) {
                    const newSubheadlines = [...editedCopy.hero_subheadline!];
                    newSubheadlines[selectedVariation] = e.target.value;
                    handleTextChange('hero_subheadline', newSubheadlines);
                  }
                }}
                className="w-full text-lg text-zinc-700 dark:text-zinc-300 bg-transparent border border-transparent hover:border-zinc-300 focus:border-blue-500 focus:outline-none rounded p-2 min-h-16 resize-none"
                placeholder="Enter subtitle (max 8 words)"
              />
            </div>
          )}
        </div>

        <div className="text-center mt-8 space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-md shadow-md hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Next: Preview Banner
          </button>
        </div>
      </main>
    </div>
  );
}
