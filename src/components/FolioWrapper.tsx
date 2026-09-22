"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const InteractiveFolio = dynamic(() => import('./InteractiveFolio'), { ssr: false });

export function FolioWrapper() {
  return <InteractiveFolio />;
}
