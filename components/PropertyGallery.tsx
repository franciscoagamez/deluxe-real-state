'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0] || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div 
        className="relative aspect-[16/10] overflow-hidden rounded-xl shadow-sm group cursor-zoom-in"
        onClick={() => setIsLightboxOpen(true)}
      >
        <Image
          src={activeImage}
          alt={title}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-102"
          sizes="(max-width: 1024px) 100vw, 800px"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-mosque text-white text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Premium</span>
          <span className="bg-white/90 backdrop-blur text-nordic text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">New</span>
        </div>
        <button className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-nordic px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur transition-all flex items-center gap-2">
          <span className="material-icons text-sm">grid_view</span>
          View All Photos ({images.length})
        </button>
      </div>

      {/* Thumbnails list */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto hide-scroll pb-2 snap-x">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(img)}
              className={`flex-none w-48 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer transition-all snap-start relative ${
                activeImage === img
                  ? 'ring-2 ring-mosque ring-offset-2 ring-offset-clear-day scale-[0.98]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${title} view ${index + 1}`}
                fill
                className="object-cover"
                sizes="192px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / Grid Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full transition-all"
            aria-label="Close lightbox"
          >
            <span className="material-icons text-2xl">close</span>
          </button>
          
          <div className="relative w-full max-w-5xl aspect-16/10 rounded-xl overflow-hidden mb-6">
            <Image
              src={activeImage}
              alt={title}
              fill
              className="object-contain"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto max-w-full pb-2">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(img)}
                className={`w-20 h-16 relative rounded-md overflow-hidden shrink-0 border-2 ${
                  activeImage === img ? 'border-mosque' : 'border-transparent opacity-60'
                }`}
              >
                <Image
                  src={img}
                  alt="Thumbnail"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
