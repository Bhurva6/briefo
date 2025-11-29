'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Download, Eye, ArrowRight, ArrowLeft, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function BriefPreviewPage() {
  const router = useRouter();
  const [briefContent, setBriefContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const briefRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedBrief = sessionStorage.getItem('briefContent');
    if (storedBrief) {
      setBriefContent(storedBrief);
      setIsLoading(false);
    } else {
      // No brief found, redirect back
      router.push('/brief');
    }
  }, [router]);

  const handleDownload = () => {
    // Create a blob with the brief content
    const blob = new Blob([briefContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-brief-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    // For PDF download, we'll create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Marketing Brief</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            h1, h2, h3, h4 { 
              color: #1a1a1a; 
              margin-top: 24px;
              margin-bottom: 12px;
            }
            h1 { font-size: 28px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { font-size: 22px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
            h3 { font-size: 18px; }
            ul, ol { padding-left: 24px; }
            li { margin-bottom: 8px; }
            p { margin-bottom: 16px; }
            strong { color: #1a1a1a; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${briefRef.current?.innerHTML || briefContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleContinue = () => {
    router.push('/banners');
  };

  const handleBack = () => {
    router.push('/brief');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading your brief...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-5xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
                Your Marketing Brief
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Generated based on your campaign details
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isPreviewMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200'
            }`}
          >
            <Eye className="w-5 h-5" />
            {isPreviewMode ? 'Formatted View' : 'Raw View'}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download as Markdown
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Print / Save as PDF
          </button>
        </div>

        {/* Brief Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="bg-zinc-100 dark:bg-zinc-800 px-6 py-3 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {isPreviewMode ? 'Formatted Preview' : 'Raw Markdown'}
            </span>
          </div>
          
          <div 
            ref={briefRef}
            className="p-6 md:p-8 max-h-[60vh] overflow-y-auto"
          >
            {isPreviewMode ? (
              <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:text-black dark:prose-headings:text-white prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-strong:text-black dark:prose-strong:text-white">
                <ReactMarkdown>{briefContent}</ReactMarkdown>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
                {briefContent}
              </pre>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-200 text-zinc-700 rounded-lg font-medium hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Edit
          </button>
          
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Templates
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
