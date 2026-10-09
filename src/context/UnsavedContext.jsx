'use client';

import React, { createContext, useContext, useRef } from 'react';

// The editor flips this ref; the navbar reads it before client-side navigation,
// which `beforeunload` cannot catch.
const UnsavedContext = createContext(null);

export const UnsavedProvider = ({ children }) => {
  const dirtyRef = useRef(false);
  return <UnsavedContext.Provider value={dirtyRef}>{children}</UnsavedContext.Provider>;
};

export const useUnsavedRef = () => useContext(UnsavedContext);
