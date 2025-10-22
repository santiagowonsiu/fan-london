'use client';

import Image from 'next/image';
import Link from 'next/link';

// Cloudinary URL will be set after upload
const CLOUDINARY_URL = process.env.NEXT_PUBLIC_CLOUDINARY_LANDING_URL || '/assets/images/IMG_1692.gif';

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden',
      background: '#000'
    }}>
      {/* Background GIF with reduced exposure */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0
      }}>
        <Image
          src={CLOUDINARY_URL}
          alt="FAN London"
          fill
          style={{ 
            objectFit: 'cover',
            filter: 'brightness(0.4) contrast(1.1)',
          }}
          priority
          unoptimized // For external URLs
        />
      </div>

      {/* Gradient overlay for better text readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
        zIndex: 1
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        padding: '40px 20px',
        maxWidth: 900,
      }}>
        <h1 style={{
          fontSize: 'clamp(42px, 8vw, 72px)',
          fontWeight: 900,
          color: 'white',
          marginBottom: 24,
          letterSpacing: '-0.02em',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          lineHeight: 1.1
        }}>
          Building the Future<br/>of Neo Nikkei Cuisine
        </h1>
        
        <p style={{
          fontSize: 'clamp(16px, 3vw, 24px)',
          color: 'rgba(255,255,255,0.95)',
          marginBottom: 48,
          fontWeight: 500,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          lineHeight: 1.6,
          maxWidth: '90%',
          margin: '0 auto 48px'
        }}>
          At FAN, we blend tradition with innovation, crafting experiences that honor
          Japanese heritage while embracing bold, contemporary flavors.
        </p>

        <Link 
          href="/products"
          style={{
            display: 'inline-block',
            padding: '18px 48px',
            background: 'white',
            color: '#111',
            fontSize: 18,
            fontWeight: 700,
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
          }}
        >
          Enter Inventory System →
        </Link>

        <div style={{
          marginTop: 60,
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          Internal Team Portal
        </div>
      </div>
    </div>
  );
}
