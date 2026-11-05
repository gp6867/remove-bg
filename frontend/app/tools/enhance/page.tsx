import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Enhance Image Quality Online – Free AI Photo Enhancer | PicArtGallery',
  description: 'Improve photo quality automatically: increase contrast, sharpness, color saturation, and brightness. Make dull photos pop. Try free demo.',
  keywords: 'enhance image, photo enhancer, improve picture quality, ai photo editor',
}

export default function EnhancePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">AI Image Enhancer – Make Your Photos Pop</h1>
      <p className="text-gray-600 mb-6">
        Automatically enhance colors, contrast, sharpness, and brightness with a single click. Bring life back to old or underexposed photos. Adjust enhancement intensity with our live slider.
      </p>

      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50 mb-8">
        <p className="text-gray-500 mb-2">Try the full enhancer →</p>
        <Link
          href="/auth/login"
          className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Login to Enhance Your Photo
        </Link>
        <p className="text-xs text-gray-400 mt-2">(Free credits on signup)</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Smart Color Correction</h2>
          <p className="text-gray-600">Balance and boost colors naturally without over‑saturation.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Detail & Sharpness</h2>
          <p className="text-gray-600">Reveal hidden details and make edges crisp.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Live Preview Slider</h2>
          <p className="text-gray-600">Adjust enhancement level from 0% to 100% and see changes instantly.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Face‑aware Enhancement</h2>
          <p className="text-gray-600">Special optimizations for portraits (skin smoothing, eye sharpening).</p>
        </div>
      </div>

      <div className="mt-10 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="list-decimal ml-6 mt-2 space-y-1">
          <li>Upload any image</li>
          <li>Use the slider to set enhancement intensity</li>
          <li>Click “Apply Enhancement”</li>
          <li>Download the improved image</li>
        </ol>
      </div>
    </div>
  )
}
