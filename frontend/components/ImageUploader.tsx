'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { imageAPI, generationAPI } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  operationType: string;
  onSuccess: (data: any) => void;
}

export default function ImageUploader({ operationType, onSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [scale, setScale] = useState(2);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [finalResultUrl, setFinalResultUrl] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Generation attachment
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  
  // Enhance slider (unchanged)
  const [enhanceIntensity, setEnhanceIntensity] = useState(50);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [appliedIntensity, setAppliedIntensity] = useState<number | null>(null);
  const liveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentFileRef = useRef<File | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Live preview for enhance
  const updateLivePreview = useCallback(async (file: File, intensity: number) => {
    if (!file) return;
    setIsLiveUpdating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/api/v1/image/enhance?intensity=${intensity}&deduct_credit=false`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: formData,
      });
      const data = await response.json();
      if (data.output_url) setLivePreviewUrl(`${API_BASE_URL}${data.output_url}`);
    } catch (error) {
      console.error('Live preview error:', error);
    } finally {
      setIsLiveUpdating(false);
    }
  }, [API_BASE_URL]);

  const handleSliderChange = useCallback((value: number) => {
    setEnhanceIntensity(value);
    if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    liveTimeoutRef.current = setTimeout(() => {
      if (currentFileRef.current) updateLivePreview(currentFileRef.current, value);
    }, 200);
  }, [updateLivePreview]);

  // File drop for other features
  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    currentFileRef.current = file;
    setSelectedFiles([file]);
    setPreviewUrl(URL.createObjectURL(file));
    setLivePreviewUrl(null);
    setFinalResultUrl(null);
    setIsApplied(false);
    setAppliedIntensity(null);
    setEnhanceIntensity(50);
    if (operationType === 'enhance') updateLivePreview(file, 50);
  }, [operationType, updateLivePreview]);

  // Apply enhancement
  const handleApplyEnhance = async () => {
    if (!currentFileRef.current) {
      toast.error('Please select an image first');
      return;
    }
    setUploading(true);
    try {
      const response = await imageAPI.enhance(currentFileRef.current, enhanceIntensity, true);
      if (response.data?.output_url) {
        setFinalResultUrl(`${API_BASE_URL}${response.data.output_url}`);
        setLivePreviewUrl(null);
        setIsApplied(true);
        setAppliedIntensity(enhanceIntensity);
        onSuccess(response.data);
        toast.success(`✨ Enhanced at ${enhanceIntensity}%!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Enhancement failed');
    } finally {
      setUploading(false);
    }
  };

  // Main process – generation uses attached image or text only
  const handleProcess = async () => {
    if (operationType === 'generate') {
      if (!prompt) {
        toast.error('Please enter a prompt');
        return;
      }
    } else if (operationType !== 'generate' && !selectedFiles.length) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    try {
      let response;
      switch (operationType) {
        case 'remove-bg':
          response = await imageAPI.removeBg(selectedFiles[0]);
          break;
        case 'upscale':
          response = await imageAPI.upscale(selectedFiles[0], scale);
          break;
        case 'enhance':
          response = await imageAPI.enhance(selectedFiles[0], enhanceIntensity, true);
          break;
        case 'generate':
          if (attachedImage) {
            response = await generationAPI.imageToImage(attachedImage, prompt);
          } else {
            response = await generationAPI.textToImage({ prompt, num_images: 1 });
          }
          break;
        case 'batch':
          response = await imageAPI.batchProcess(selectedFiles);
          break;
        default:
          return;
      }
      if (response.data?.output_url) {
        setFinalResultUrl(`${API_BASE_URL}${response.data.output_url}`);
        setLivePreviewUrl(null);
        onSuccess(response.data);
        toast.success('Done!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setLivePreviewUrl(null);
    setFinalResultUrl(null);
    setSelectedFiles([]);
    setAttachedImage(null);
    if (attachedPreview) URL.revokeObjectURL(attachedPreview);
    setAttachedPreview(null);
    currentFileRef.current = null;
    setIsApplied(false);
    setAppliedIntensity(null);
    setEnhanceIntensity(50);
  };

  const clearAttached = () => {
    setAttachedImage(null);
    if (attachedPreview) URL.revokeObjectURL(attachedPreview);
    setAttachedPreview(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: operationType === 'batch',
    disabled: operationType === 'generate',
  });

  const displayImage = finalResultUrl || livePreviewUrl || previewUrl;
  const isEnhanceMode = operationType === 'enhance';
  const showSlider = isEnhanceMode && previewUrl && !isApplied;
  const isProcessing = uploading || isLiveUpdating;

  return (
    <div className="space-y-4">
      {/* ========== AI GENERATE TAB – SINGLE UNIFIED BOX ========== */}
      {operationType === 'generate' && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          {/* Attached image preview (inside the same box) */}
          {attachedPreview && (
            <div className="mb-3">
              <div className="relative inline-block">
                <img
                  src={attachedPreview}
                  alt="Attached"
                  className="h-20 w-auto object-contain rounded-md border"
                />
                <button
                  onClick={clearAttached}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Prompt container: relative to position the plus icon inside the textarea */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                attachedImage
                  ? "Describe how you want to edit the image..."
                  : "Describe the image you want to create..."
              }
              rows={3}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {/* Plus icon – positioned absolutely inside the textarea, bottom-left corner */}
            <button
              onClick={() => document.getElementById('gen-image-input')?.click()}
              className="absolute bottom-2 left-2 text-gray-400 hover:text-purple-600 transition"
              title="Attach image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            id="gen-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setAttachedImage(file);
                if (attachedPreview) URL.revokeObjectURL(attachedPreview);
                setAttachedPreview(URL.createObjectURL(file));
              }
            }}
          />

          {/* Generate button */}
          <button
            onClick={handleProcess}
            disabled={uploading || !prompt}
            className="mt-3 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? 'Generating...' : `🎨 Generate (5 credits)`}
          </button>
        </div>
      )}

      {/* ========== OTHER FEATURES (unchanged) ========== */}
      {operationType !== 'generate' && (
        <>
          {/* Upscale factor selector */}
          {operationType === 'upscale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upscale Factor</label>
              <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg">
                <option value={2}>2x (2 credits)</option>
                <option value={4}>4x (3 credits)</option>
                <option value={8}>8x (5 credits)</option>
              </select>
            </div>
          )}

          {/* Batch info */}
          {operationType === 'batch' && (
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-purple-700 text-sm">📸 Multiple images, 1 credit per image</p>
            </div>
          )}

          {/* Image dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-all relative
              ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}
              ${isProcessing ? 'opacity-70 pointer-events-none' : ''}
              ${displayImage ? 'p-4' : 'p-12'}`}
          >
            <input {...getInputProps()} />
            {displayImage ? (
              <div className="relative">
                <img src={displayImage} alt="Preview" className="max-h-64 rounded-lg mx-auto object-contain" />
                <button
                  onClick={(e) => { e.stopPropagation(); clearAll(); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
                {isLiveUpdating && <div className="mt-2 text-center text-sm text-gray-500">Updating preview...</div>}
                {isApplied && appliedIntensity && (
                  <div className="mt-2 text-center text-sm font-semibold text-green-600">
                    ✓ Enhanced at {appliedIntensity}%
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl">📸</div>
                <p className="text-gray-600">{isDragActive ? 'Drop here...' : 'Drag & drop or click'}</p>
                <p className="text-sm text-gray-400">JPG, PNG, WEBP (Max 10MB)</p>
              </div>
            )}
          </div>

          {/* Enhance slider */}
          {showSlider && (
            <div className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-xl">✨</span> Enhancement Level
                </span>
                <span className="text-2xl font-bold text-emerald-600">{enhanceIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={enhanceIntensity}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Natural (0%)</span>
                <span>Balanced (50%)</span>
                <span>Dramatic (100%)</span>
              </div>
              <div className="mt-2 text-center text-sm text-gray-600">
                💡 Live preview updates as you slide
              </div>
            </div>
          )}

          {/* Apply Enhancement button */}
          {showSlider && (
            <button
              onClick={handleApplyEnhance}
              disabled={uploading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? 'Applying...' : `✨ Apply Enhancement (${enhanceIntensity}%)`}
            </button>
          )}

          {/* Other operation buttons */}
          {operationType !== 'enhance' && !isApplied && operationType !== 'generate' && (
            <button
              onClick={handleProcess}
              disabled={uploading || !previewUrl}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? 'Processing...' : operationType === 'upscale' ? '🚀 Upscale' : operationType === 'batch' ? '⚡ Process Batch' : '🎨 Remove Background'}
            </button>
          )}
        </>
      )}

      {/* Download button */}
      {finalResultUrl && (
        <div className="flex justify-center pt-2">
          <button
            onClick={async () => {
              try {
                const res = await fetch(finalResultUrl);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = appliedIntensity ? `enhanced-${appliedIntensity}%.png` : `image-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`Downloaded! ${appliedIntensity ? `${appliedIntensity}% enhancement` : ''}`);
              } catch {
                toast.error('Download failed');
              }
            }}
            className="text-sm bg-green-500 hover:bg-green-600 text-white px-5 py-1.5 rounded-full"
          >
            📥 Download
          </button>
        </div>
      )}
    </div>
  );
}
