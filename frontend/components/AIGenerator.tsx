'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

interface AIGeneratorProps {
  onImageGenerated: (urls: string[]) => void;
}

export default function AIGenerator({ onImageGenerated }: AIGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('bad quality, blurry, ugly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    numImages: 1,
    width: 512,
    height: 512,
    steps: 30,
    guidance: 7.5,
    autoEnhance: true,
    model: 'stable-diffusion'
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/generate/from-prompt`,
        {
          prompt: prompt,
          negative_prompt: negativePrompt,
          width: settings.width,
          height: settings.height,
          num_inference_steps: settings.steps,
          guidance_scale: settings.guidance,
          num_images: settings.numImages,
          model: settings.model,
          auto_enhance: settings.autoEnhance
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setGeneratedImages(response.data.output_urls);
        onImageGenerated(response.data.output_urls);
        toast.success(`Generated ${response.data.num_images} images!`);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Insufficient credits. Please purchase more credits.');
      } else {
        toast.error(error.response?.data?.detail || 'Generation failed');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestedPrompts = [
    "A beautiful sunset over mountains, digital art",
    "Cyberpunk city at night, neon lights, rain",
    "Cute cat wearing a wizard hat, fantasy art",
    "Abstract geometric patterns, vibrant colors",
    "Portrait of a futuristic warrior, cinematic lighting"
  ];

  return (
    <div className="space-y-6">
      {/* Main Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What do you want to create?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A beautiful landscape with mountains and a lake at sunset, hyperrealistic, 8k..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Negative Prompt (Advanced) */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
          Advanced Settings (Negative Prompt, Dimensions, etc.)
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Negative Prompt</label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What to avoid..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Width</label>
              <select
                value={settings.width}
                onChange={(e) => setSettings({...settings, width: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={512}>512x512</option>
                <option value={768}>768x768</option>
                <option value={1024}>1024x1024</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Number of Images</label>
              <select
                value={settings.numImages}
                onChange={(e) => setSettings({...settings, numImages: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={1}>1 Image (5 credits)</option>
                <option value={2}>2 Images (10 credits)</option>
                <option value={4}>4 Images (20 credits)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoEnhance"
              checked={settings.autoEnhance}
              onChange={(e) => setSettings({...settings, autoEnhance: e.target.checked})}
              className="rounded"
            />
            <label htmlFor="autoEnhance" className="text-sm text-gray-600">
              Auto-enhance (Upscale + Face restore + Color correction)
            </label>
          </div>
        </div>
      </details>

      {/* Suggested Prompts */}
      <div>
        <p className="text-sm text-gray-600 mb-2">Try these prompts:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(suggestion)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition"
            >
              {suggestion.substring(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={`
          w-full py-3 rounded-lg font-semibold transition-all
          ${isGenerating || !prompt.trim()
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
          }
        `}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating AI Art...
          </span>
        ) : (
          `Generate ${settings.numImages} Image${settings.numImages > 1 ? 's' : ''} (${settings.numImages * 5} credits)`
        )}
      </button>

      {/* Generated Images Display */}
      {generatedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Generated Images:</h3>
          <div className={`grid gap-4 ${generatedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {generatedImages.map((url, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <img src={url} alt={`Generated ${idx + 1}`} className="rounded-lg w-full shadow-md" />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                  <button
                    onClick={() => window.open(url, '_blank')}
                    className="px-3 py-1 bg-white rounded text-sm"
                  >
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
