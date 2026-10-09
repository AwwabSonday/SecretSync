'use client';

import React from 'react';
import Navbar from './Navbar';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-dvh bg-ink flex flex-col font-sans">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-brand focus:text-ink focus:text-sm"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
    </div>
  );
};

export default AppLayout;
