"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Product } from '../app/types/product';

interface ProductCardProps {
  product: Product;
  discountPercent: number;
  rating: string;
  orders: number;
}

export default function ProductCard({ product, discountPercent, rating, orders }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      href={`/products/${product.id}`}
      className="relative bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl w-full block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-bold z-10">
        -{discountPercent}%
      </div>

      {/* Image Container */}
      <div className="relative bg-white h-64 overflow-hidden flex items-center justify-center">
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-2 right-2 bg-white p-2 shadow-md z-20 transition-all duration-300 hover:scale-110"
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-300 ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>

        {product.image_url && product.image_url.trim() !== '' ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full object-contain transition-transform duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement;
              if (fallback) {
                fallback.innerHTML = '<div class="bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center text-5xl w-full h-full">📦</div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            📦
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-gray-800 font-normal text-sm mb-2 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold text-red-500">
            {Number(product.price || 0).toLocaleString()} RWF
          </span>
        </div>

        {/* Rating and Orders */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm text-gray-600">{rating}</span>
          </div>
          <span className="text-sm text-gray-400">{orders} orders</span>
        </div>
      </div>
    </Link>
  );
}

