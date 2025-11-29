"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { CampaignInput } from '../../types';

const InputWizard: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const valid = !!state.campaignInput.occasionType && !!state.campaignInput.targetAudience && !!state.campaignInput.messagingGoal && !!state.campaignInput.callToAction?.trim() && !!state.campaignInput.tone;
    setIsFormValid(valid);
  }, [state.campaignInput]);

  const occasionTypes = [
    { value: 'product-launch', label: 'Product Launch', description: 'Introduce new products or services' },
    { value: 'seasonal', label: 'Seasonal Campaign', description: 'Holiday or seasonal promotions' },
    { value: 'brand-awareness', label: 'Brand Awareness', description: 'Build brand recognition' },
    { value: 'event', label: 'Event Promotion', description: 'Promote events or webinars' },
    { value: 'educational', label: 'Educational Content', description: 'Inform and educate audience' },
    { value: 'customer-retention', label: 'Customer Retention', description: 'Engage existing customers' },
  ];

  const targetAudiences = [
    { value: 'existing-customers', label: 'Existing Customers', description: 'Current client base' },
    { value: 'prospects', label: 'Prospects', description: 'Potential new customers' },
    { value: 'partners', label: 'Business Partners', description: 'B2B partnerships' },
    { value: 'employees', label: 'Internal Teams', description: 'Company employees' },
    { value: 'investors', label: 'Investors', description: 'Stakeholders and investors' },
    { value: 'general-public', label: 'General Public', description: 'Broad market audience' },
  ];

  const messagingGoals = [
    { value: 'awareness', label: 'Build Awareness', description: 'Increase brand or product visibility' },
    { value: 'engagement', label: 'Drive Engagement', description: 'Encourage interaction and participation' },
    { value: 'conversion', label: 'Generate Conversions', description: 'Drive sales or sign-ups' },
    { value: 'education', label: 'Educate Audience', description: 'Inform about features or benefits' },
    { value: 'retention', label: 'Improve Retention', description: 'Keep customers engaged' },
    { value: 'trust', label: 'Build Trust', description: 'Establish credibility and reliability' },
  ];

  const toneOptions = [
    { value: 'formal', label: 'Formal', description: 'Professional and authoritative' },
    { value: 'friendly', label: 'Friendly', description: 'Approachable and conversational' },
    { value: 'motivating', label: 'Motivating', description: 'Inspiring and energetic' },
  ];

  const handleInputChange = (field: keyof CampaignInput, value: string) => {
    dispatch({
      type: 'UPDATE_CAMPAIGN_INPUT',
      payload: { [field]: value }
    });

    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const { campaignInput } = state;

    if (!campaignInput.occasionType) {
      newErrors.occasionType = 'Please select an occasion type';
    }
    if (!campaignInput.targetAudience) {
      newErrors.targetAudience = 'Please select a target audience';
    }
    if (!campaignInput.messagingGoal) {
      newErrors.messagingGoal = 'Please select a messaging goal';
    }
    if (!campaignInput.callToAction?.trim()) {
      newErrors.callToAction = 'Please enter a call-to-action';
    }
    if (!campaignInput.tone) {
      newErrors.tone = 'Please select a tone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
    }
  };

  const handleCreateBrief = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state.campaignInput),
      });

      if (!response.ok) {
        throw new Error('Failed to generate brief');
      }

      const data = await response.json();
      sessionStorage.setItem('briefContent', data.briefContent);
      sessionStorage.setItem('department', 'marketing'); // Default department
      router.push('/brief-preview');
    } catch (error) {
      console.error('Error creating brief:', error);
      alert('Failed to create brief. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderOptionGrid = (
    options: Array<{ value: string; label: string; description: string }>,
    selectedValue: string | undefined,
    onChange: (value: string) => void,
    fieldName: string
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            p-4 rounded-lg border-2 text-left transition-all duration-200
            ${selectedValue === option.value
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            }
          `}
        >
          <div className="font-medium text-zinc-900 mb-1">
            {option.label}
          </div>
          <div className="text-sm text-zinc-600">
            {option.description}
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 relative">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Generating Your Marketing Brief
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Creating a comprehensive brief based on your inputs...
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Campaign Details
          </h2>
          <p className="text-zinc-600">
            Let's gather some information about your campaign to generate the perfect content
          </p>
        </div>

        {/* Occasion Type */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-lg font-semibold text-zinc-900">
              What's the occasion for this campaign?
            </label>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600"
              title="Choose the type of campaign you're creating"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          {renderOptionGrid(
            occasionTypes,
            state.campaignInput.occasionType,
            (value) => handleInputChange('occasionType', value),
            'occasionType'
          )}
          {errors.occasionType && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.occasionType}</span>
            </div>
          )}
        </div>

        {/* Target Audience */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-lg font-semibold text-zinc-900">
              Who is your target audience?
            </label>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600"
              title="Select the primary audience for your campaign"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          {renderOptionGrid(
            targetAudiences,
            state.campaignInput.targetAudience,
            (value) => handleInputChange('targetAudience', value),
            'targetAudience'
          )}
          {errors.targetAudience && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.targetAudience}</span>
            </div>
          )}
        </div>

        {/* Messaging Goal */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-lg font-semibold text-zinc-900">
              What's your primary messaging goal?
            </label>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600"
              title="Choose the main objective of your campaign"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          {renderOptionGrid(
            messagingGoals,
            state.campaignInput.messagingGoal,
            (value) => handleInputChange('messagingGoal', value),
            'messagingGoal'
          )}
          {errors.messagingGoal && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.messagingGoal}</span>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="cta" className="text-lg font-semibold text-zinc-900">
              What should your audience do next? (This will be the CTA)
            </label>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600"
              title="Enter the desired action you want users to take"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <textarea
            id="cta"
            value={state.campaignInput.callToAction || ''}
            onChange={(e) => handleInputChange('callToAction', e.target.value)}
            placeholder="e.g., Sign up for our newsletter, Visit our website, Download the app..."
            className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                       transition-colors duration-200 resize-none placeholder:text-black text-black
                       ${errors.callToAction ? 'border-red-300' : 'border-zinc-200'}`}
            rows={3}
          />
          {errors.callToAction && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.callToAction}</span>
            </div>
          )}
        </div>

        {/* Tone */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-lg font-semibold text-zinc-900">
              What tone should your content have?
            </label>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600"
              title="Choose the communication style for your campaign"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          {renderOptionGrid(
            toneOptions,
            state.campaignInput.tone,
            (value) => handleInputChange('tone', value as 'formal' | 'friendly' | 'motivating'),
            'tone'
          )}
          {errors.tone && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.tone}</span>
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-6 border-t border-zinc-200">
          <button
            onClick={isFormValid ? handleCreateBrief : handleNext}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white 
                     rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Create Brief'}
            {!isGenerating && <ChevronRight className="w-5 h-5" />}
            {isGenerating && <Loader2 className="w-5 h-5 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Brief() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center w-full">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Create Brief
          </h1>
          <p className="max-w-md text-xl leading-8 text-zinc-600 dark:text-zinc-400">
            Create your marketing brief here.
          </p>
          <InputWizard />
        </div>
      </main>
    </div>
  );
}
