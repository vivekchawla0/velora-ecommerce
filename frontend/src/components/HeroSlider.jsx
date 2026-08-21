import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const slides = [
  {
    id: 'wooden-collection',
    bg: '#DCEEEB', // Reference-style seafoam/teal tint
    eyebrow: 'FEATURED DESIGN 2026',
    title: 'WOODEN & MINIMAL COLLECTION',
    description: 'Handcrafted contemporary furniture and lifestyle pieces designed for everyday tranquility and timeless aesthetics.',
    ctaText: 'Shop Collection',
    ctaLink: '/products?category=home-living',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80',
    alt: 'Minimalist Wooden Lounge Chair and Contemporary Interior',
    tag: 'Signature Release',
  },
  {
    id: 'acoustic-mastery',
    bg: '#F3EDE6', // Warm sand tint
    eyebrow: 'ACOUSTIC ENGINEERING',
    title: 'STUDIO SOUNDSCAPE SERIES',
    description: 'Immersive high-fidelity audio engineering with active noise cancellation and custom-tuned beryllium drivers.',
    ctaText: 'Explore Audio',
    ctaLink: '/products?category=audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80',
    alt: 'Studio Soundscape Wireless Headphones',
    tag: 'Bestseller',
  },
  {
    id: 'autumn-apparel',
    bg: '#E8ECEE', // Soft slate tint
    eyebrow: 'AUTUMN / WINTER 2026',
    title: 'CONTEMPORARY APPAREL',
    description: 'Premium organic textures, tailored silhouettes, and versatile wardrobe essentials designed for effortless elegance.',
    ctaText: 'Discover Apparel',
    ctaLink: '/products?category=fashion',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80',
    alt: 'Contemporary Minimal Fashion Essentials',
    tag: 'New Season',
  },
  {
    id: 'precision-electronics',
    bg: '#E5EDE7', // Soft sage tint
    eyebrow: 'PRODUCTIVITY TOOLS',
    title: 'PRECISION ELECTRONICS',
    description: 'Next-generation computing and workspace accessories crafted with aerospace-grade finishes.',
    ctaText: 'Shop Electronics',
    ctaLink: '/products?category=electronics',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=80',
    alt: 'Ultra-slim Aluminum Pro Laptop',
    tag: 'Flagship Edition',
  },
];

export const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();

    touchStartX.current = null;
  };

  const activeSlide = slides[currentSlide];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: activeSlide.bg,
        transition: 'background-color 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="container hero-slider-container"
        style={{
          minHeight: '520px',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          alignItems: 'center',
          gap: '3rem',
          paddingTop: '3.5rem',
          paddingBottom: '3.5rem',
          position: 'relative',
        }}
      >
        {/* Left: Text & Editorial Typography */}
        <div style={{ zIndex: 2, maxWidth: '580px' }}>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              display: 'inline-block',
            }}
          >
            {activeSlide.eyebrow}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
              fontWeight: 850,
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              color: 'var(--text-primary)',
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
            }}
          >
            {activeSlide.title}
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2.25rem',
            }}
          >
            {activeSlide.description}
          </p>

          <div>
            <Link
              to={activeSlide.ctaLink}
              className="btn btn-outline-dark btn-lg"
              style={{
                borderRadius: '4px',
                padding: '0.9rem 2.25rem',
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 750,
              }}
            >
              {activeSlide.ctaText}
            </Link>
          </div>
        </div>

        {/* Right: High-Res Lifestyle Showcase Image */}
        <div
          className="hero-image-wrapper"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '360px',
            zIndex: 1,
          }}
        >
          <img
            key={activeSlide.id}
            src={activeSlide.image}
            alt={activeSlide.alt}
            style={{
              width: '100%',
              maxHeight: '440px',
              objectFit: 'contain',
              animation: 'heroFadeIn 0.5s ease-out',
              filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.12))',
            }}
          />
        </div>

        {/* Floating Circular Arrow Buttons (Positioned across the visual boundaries) */}
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '1.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'var(--transition-fast)',
          }}
          className="hero-arrow-btn"
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '1.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'var(--transition-fast)',
          }}
          className="hero-arrow-btn"
          aria-label="Next slide"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Pagination Dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '0.65rem',
          zIndex: 10,
        }}
      >
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            style={{
              width: currentSlide === idx ? '28px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: currentSlide === idx ? 'var(--text-primary)' : 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <style>{`
        @keyframes heroFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (hover: hover) and (pointer: fine) {
          .hero-arrow-btn:hover {
            background: #FFFFFF !important;
            transform: translateY(-50%) scale(1.06) !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
          }
        }
        .hero-arrow-btn:active {
          transform: translateY(-50%) scale(0.94) !important;
        }
        @media (max-width: 868px) {
          .hero-slider-container {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            padding-top: 2rem !important;
            padding-bottom: 2.5rem !important;
            text-align: center !important;
            gap: 1.5rem !important;
          }
          .hero-image-wrapper {
            min-height: auto !important;
          }
          .hero-image-wrapper img {
            max-height: 240px !important;
          }
          .hero-slider-container h1 {
            font-size: 1.85rem !important;
            margin-bottom: 0.75rem !important;
          }
          .hero-slider-container p {
            font-size: 0.9rem !important;
            margin-bottom: 1.25rem !important;
            line-height: 1.5 !important;
          }
          .hero-arrow-btn {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .hero-slider-container {
            padding-top: 1.5rem !important;
            padding-bottom: 2.25rem !important;
            gap: 1.25rem !important;
          }
          .hero-slider-container h1 {
            font-size: 1.55rem !important;
            line-height: 1.15 !important;
            margin-bottom: 0.5rem !important;
          }
          .hero-slider-container p {
            font-size: 0.835rem !important;
            margin-bottom: 1.15rem !important;
          }
          .hero-image-wrapper img {
            max-height: 200px !important;
          }
        }
        @media (max-width: 380px) {
          .hero-slider-container h1 {
            font-size: 1.4rem !important;
          }
          .hero-image-wrapper img {
            max-height: 180px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;
