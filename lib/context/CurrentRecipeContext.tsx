'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface CurrentRecipeInfo {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string | null;
  notes: string | null;
}

interface CurrentRecipeContextValue {
  currentRecipe: CurrentRecipeInfo | null;
  setCurrentRecipe: (recipe: CurrentRecipeInfo | null) => void;
}

// Default (no-op) value used when a consumer renders outside a provider —
// e.g. a transient render during navigation/auth transitions. Falling back
// silently here is preferable to crashing the whole app over a "nice to
// have" chat feature.
const defaultValue: CurrentRecipeContextValue = {
  currentRecipe: null,
  setCurrentRecipe: () => {},
};

const CurrentRecipeContext = createContext<CurrentRecipeContextValue>(defaultValue);

export function CurrentRecipeProvider({ children }: { children: ReactNode }) {
  const [currentRecipe, setCurrentRecipe] = useState<CurrentRecipeInfo | null>(null);

  return (
    <CurrentRecipeContext.Provider value={{ currentRecipe, setCurrentRecipe }}>
      {children}
    </CurrentRecipeContext.Provider>
  );
}

export function useCurrentRecipe() {
  return useContext(CurrentRecipeContext);
}
