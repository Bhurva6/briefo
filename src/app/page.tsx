"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSelectTemplate = async () => {
    if (!uploadedFile || !selectedDepartment) return;

    setIsGenerating(true);

    try {
      // Read the file content
      const text = await uploadedFile.text();
      
      // Store brief content and department in sessionStorage
      sessionStorage.setItem('briefContent', text);
      sessionStorage.setItem('department', selectedDepartment);
      
      // Navigate to template selection
      router.push('/banners');
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Brief to Banner
          </h1>
          <p className="max-w-md text-xl leading-8 text-zinc-600 dark:text-zinc-400">
            Transform your marketing briefs into stunning banners with
            AI-powered copy generation.
          </p>

          <div className="w-full max-w-sm">
            <label
              htmlFor="department"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Select Department
            </label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
            >
              <option value="">Choose a department...</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
              <option value="product">Product</option>
              <option value="hr">Human Resources</option>
              <option value="finance">Finance</option>
            </select>
          </div>

          <div className="w-full max-w-sm">
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Upload Brief Document
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadedFile && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Selected: {uploadedFile.name}
              </p>
            )}
          </div>

          <button
            onClick={handleSelectTemplate}
            disabled={!selectedDepartment || !uploadedFile || isGenerating}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select Template
          </button>
        </div>
      </main>
    </div>
  );
}
