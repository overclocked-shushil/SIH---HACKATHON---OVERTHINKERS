'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'var(--green-800)',
            fontWeight: 800,
            fontSize: '1.25rem',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🌾</span>
          <span>Krishi Mitra</span>
        </Link>

        {/* Desktop links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
          className="hidden-mobile"
        >
          <Link href="/centres" className="btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
            Centres
          </Link>
          <Link href="/auth" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            Login / Register
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-only btn-ghost"
          style={{
            padding: '0.5rem',
            fontSize: '1.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="mobile-only"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'white',
          }}
        >
          <Link
            href="/centres"
            className="sidebar-link"
            onClick={() => setMenuOpen(false)}
          >
            🏢 Centres
          </Link>
          <Link
            href="/auth"
            className="btn btn-primary"
            style={{ textDecoration: 'none', marginTop: '0.5rem' }}
            onClick={() => setMenuOpen(false)}
          >
            Login / Register
          </Link>
        </div>
      )}

      <style>{`
        .hidden-mobile {
          display: flex !important;
        }
        .mobile-only {
          display: none !important;
        }
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}
