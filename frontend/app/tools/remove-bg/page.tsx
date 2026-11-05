import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Remove Background from Image Online – Free AI Tool | PicArtGallery',
  description: 'Remove image background instantly with AI. Perfect for product photos, portraits, and e-commerce. 100% free, no signup needed.',
}

export default function RemoveBgPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Free AI Background Remover</h1>
      <p className="mb-6">Upload any image and get a transparent background in seconds. No registration required.</p>
      {/* You can embed a simple uploader or just a demo video */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <p className="text-gray-500">Demo: Drag & drop an image</p>
        {/* For now, just a placeholder; you can later add a mini tool */}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">How to remove background</h2>
        <ol className="list-decimal ml-6 mt-2">
          <li>Upload your image</li>
          <li>AI automatically removes background</li>
          <li>Download transparent PNG</li>
        </ol>
      </div>
    </div>
  )
}
