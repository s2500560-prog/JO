import React, { useEffect, useState } from 'react';
import executiveWoodDeskImg from '../assets/images/executive_wood_desk_1795084740574.jpg';
import modularKitchenCabinetsImg from '../assets/images/modular_kitchen_cabinets_1795084740969.jpg';
import rectangularDiningTableImg from '../assets/images/rectangular_dining_table_1795084740438.jpg';
import roundPedestalTableImg from '../assets/images/round_pedestal_table_1795084740431.jpg';
import woodArmchairImg from '../assets/images/wood_armchair_1795084739984.jpg';
import { getBlurHashGradient } from '../utils/uxPrimitives';
import type { FurnitureKind, ProductionStage } from '../types/saw2sale';

interface FurnitureIllustrationProps {
  kind: FurnitureKind;
  stage?: ProductionStage | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PHOTO_BY_KIND: Partial<Record<FurnitureKind, { src: string; alt: string }>> = {
  'lounge-chair': {
    src: woodArmchairImg,
    alt: 'Sculpted solid wood lounge armchair',
  },
  console: {
    src: roundPedestalTableImg,
    alt: 'Round turned-pedestal solid wood table',
  },
  'dining-table': {
    src: rectangularDiningTableImg,
    alt: 'Rectangular dark solid wood dining table',
  },
  desk: {
    src: executiveWoodDeskImg,
    alt: 'Rosewood and chrome executive desk',
  },
  cabinets: {
    src: modularKitchenCabinetsImg,
    alt: 'Modular solid wood kitchen cabinetry',
  },
  'bed-frame': {
    src: './assets/aistudio/image_5f42ccc3.png',
    alt: 'Solid acacia platform bed frame with paneled headboard',
  },
};

export const FurnitureIllustration: React.FC<FurnitureIllustrationProps> = ({
  kind,
  stage,
  size = 'md',
  className = '',
}) => {
  const [revealed, setRevealed] = useState(false);
  const photo = PHOTO_BY_KIND[kind];

  useEffect(() => {
    setRevealed(false);
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [kind]);

  const dims =
    size === 'sm'
      ? 'w-14 h-14 rounded-lg'
      : size === 'lg'
        ? 'w-full h-44 rounded-xl'
        : 'w-24 h-24 rounded-xl';

  const renderFallbackSvg = () => (
    <g>
      <ellipse cx="60" cy="77" rx="42" ry="4" fill="#6E5539" opacity="0.35" />
      <rect x="20" y="28" width="80" height="24" rx="2" fill="#783D1C" />
      <rect x="20" y="28" width="80" height="2" fill="#9E562C" />
      <rect x="22" y="45" width="76" height="14" rx="2" fill="#EFEAE0" />
      <rect x="18" y="58" width="84" height="9" rx="1" fill="#8A4722" />
      <rect x="22" y="67" width="6" height="9" fill="#592C14" />
      <rect x="92" y="67" width="6" height="9" fill="#592C14" />
    </g>
  );

  return (
    <div
      className={`product-stage relative overflow-hidden border border-white/60 shrink-0 ${dims} ${className}`}
      aria-label={`${kind} workshop preview`}
    >
      {/* BlurHash Placeholder Layer */}
      <div
        className={`absolute inset-0 z-20 transition-opacity duration-300 pointer-events-none ${
          revealed ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundImage: getBlurHashGradient(kind) }}
        aria-hidden="true"
      />
      {photo ? (
        <img
          src={photo.src}
          alt={photo.alt}
          referrerPolicy="no-referrer"
          onLoad={() => setRevealed(true)}
          className={`w-full h-full object-cover object-center relative z-10 transition-opacity duration-200 ${
            revealed ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <>
          <div
            className="absolute inset-x-0 bg-white/35"
            style={{ top: '72%', height: '1.5px' }}
            aria-hidden="true"
          />
          <svg
            viewBox="0 0 120 90"
            className={`w-full h-full relative z-10 transition-opacity duration-200 ${
              revealed ? 'opacity-100' : 'opacity-0'
            }`}
            role="img"
            aria-label={`${kind} illustration`}
          >
            {renderFallbackSvg()}
          </svg>
        </>
      )}
      {stage && size === 'lg' && (
        <span className="absolute bottom-2 left-3 z-30 text-xs font-semibold text-white/95 bg-[#1B1712]/75 px-2.5 py-1 rounded-md">
          {stage} Stage
        </span>
      )}
    </div>
  );
};
