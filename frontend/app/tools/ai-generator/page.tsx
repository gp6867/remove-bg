import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Image Generator – Text to Image Online Free | PicArtGallery',
  description: 'Create stunning images from text descriptions. Generate art, illustrations, and photos using advanced AI. Try free demo.',
  keywords: 'ai image generator, text to image, ai art generator, generate image from prompt',
}

export default function AIGeneratorPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">AI Image Generator – Turn Words into Art</h1>
      <p className="text-gray-600 mb-6">
        Describe what you want, and our AI will generate a unique image. Ideal for concept art, social media visuals, product mockups, or just for fun.
      </p>

      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50 mb-8">
        <p className="text-gray-500 mb-2">Try the full AI generator →</p>
        <Link
          href="/auth/login"
          className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
        >
          Login to Generate Images
        </Link>
        <p className="text-xs text-gray-400 mt-2">(Free credits on signup)</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Text‑to‑Image</h2>
          <p className="text-gray-600">Type any prompt – “cyberpunk cat”, “sunset over mountains” – and get an image in seconds.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Image‑to‑Image</h2>
          <p className="text-gray-600">Upload a photo and describe how to edit it (e.g., “make it a cartoon”).</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">High Resolution</h2>
          <p className="text-gray-600">Generated images are high‑quality and can be upscaled further.</p>
        </div>
      </div>

      <div className="mt-10 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="list-decimal ml-6 mt-2 space-y-1">
          <li>Enter a descriptive text prompt</li>
          <li>(Optional) Upload an image to edit</li>
          <li>Click “Generate” – AI creates your image</li>
          <li>Download or share the result</li>
        </ol>
      </div>
    </div>
  )
}
