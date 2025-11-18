"use client"
import React from 'react';
import Link from 'next/link';

export default function LaunchOutfitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Mannequin Display */}
        <div className="mb-8">
          <div className="text-9xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
            🎭
          </div>
          <div className="text-6xl mb-4">
            👔👗👕
          </div>
          <div className="text-4xl">
            🧥👖👠
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
          Launch Outfit
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-700 mb-8">
          Coming Soon! 🚀
        </p>
        
        {/* Description */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl mb-8">
          <p className="text-lg text-gray-600 mb-4">
            Get ready to style your perfect outfit! Our outfit builder is currently under development.
          </p>
          <p className="text-base text-gray-500">
            Mix and match your favorite pieces to create the perfect look. Coming soon with amazing features!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all transform hover:scale-105 shadow-xl"
          >
            Back to Home
          </Link>
          <Link
            href="/products"
            className="bg-white text-gray-700 border-2 border-gray-300 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Browse Products
          </Link>
        </div>

        {/* Fun Elements */}
        <div className="mt-12 flex justify-center gap-4 text-3xl">
          <span className="animate-pulse">✨</span>
          <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>💫</span>
          <span className="animate-pulse" style={{ animationDelay: '1s' }}>⭐</span>
        </div>
      </div>
    </div>
  );
}

