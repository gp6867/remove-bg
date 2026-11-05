import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/AuthContext'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PicArtGallery – AI Image Editor: Remove BG, Upscale, Enhance, Generate',
  description: 'Free AI tools: remove background, upscale to 4K, enhance face, generate stunning images from text. No signup required.',
  keywords: 'remove background, ai image generator, upscale image, enhance photo, ai art, picartgallery, pi art, gallery',
  openGraph: {
    title: 'PicArtGallery – AI Image Editor',
    description: 'Remove background, upscale, enhance, generate – all in one place.',
    url: 'https://picartgallery.in',
    siteName: 'PicArtGallery',
    images: [
      {
        url: 'https://picartgallery.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PicArtGallery AI Image Editor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PicArtGallery – AI Image Editor',
    description: 'Free AI image tools: remove background, upscale, enhance, generate.',
    images: ['https://picartgallery.in/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://picartgallery.in',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Schema.org markup for SoftwareApplication (SEO rich snippet) */}
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'PicArtGallery',
              applicationCategory: 'PhotoEditor',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '127',
              },
              featureList: 'Remove background, upscale images, enhance faces, AI generation',
              description: 'Free AI image editor: remove background, upscale to 4K, enhance faces, generate art from text.',
              url: 'https://picartgallery.in',
              screenshot: 'https://picartgallery.in/og-image.png',
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
