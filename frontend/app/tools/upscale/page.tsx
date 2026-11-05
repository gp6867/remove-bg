import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Upscale Image Online – Free AI Image Upscaler to 4K/8K | PicArtGallery',
  description: 'Enlarge your images using AI. Upscale photos to 2x, 4x, or 8x without losing quality. Perfect for printing, wallpapers, and zoom. Try free demo.',
  keywords: 'upscale image, image upscaler, 4k upscaler, enlarge photo, ai upscale',
}

export default function UpscalePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">AI Image Upscaler – Enhance Resolution without Quality Loss</h1>
      <p className="text-gray-600 mb-6">
        Our AI‑powered upscaler increases image resolution while preserving sharpness and details. Choose 2x, 4x, or 8x enlargement – perfect for printing, high‑DPI displays, and zooming into photos.
      </p>

      {/* Placeholder demo area */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50 mb-8">
        <p className="text-gray-500 mb-2">Try the full upscaler →</p>
        <Link
          href="/auth/login"
          className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
        >
          Login to Upscale Your Image
        </Link>
        <p className="text-xs text-gray-400 mt-2">(Free credits on signup)</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">2x Upscaling</h2>
          <p className="text-gray-600">Double the resolution – ideal for social media and web use.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">4x Upscaling</h2>
          <p className="text-gray-600">Print‑ready quality for posters, flyers, and 4K displays.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">8x Upscaling</h2>
          <p className="text-gray-600">Extreme enlargement for billboards and ultra‑HD projects.</p>
        </div>
      </div>

      <div className="mt-10 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="list-decimal ml-6 mt-2 space-y-1">
          <li>Upload an image (JPG, PNG, WEBP)</li>
          <li>Select upscale factor (2x, 4x, or 8x)</li>
          <li>AI processes and returns a high‑resolution image</li>
          <li>Download your enlarged image</li>
        </ol>
      </div>
    </div>
  )
}
