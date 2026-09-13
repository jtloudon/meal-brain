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

const CurrentRecipeContext = createContext<CurrentRecipeContextValue | undefined>(undefined);

export function CurrentRecipeProvider({ children }: { children: ReactNode }) {
  const [currentRecipe, setCurrentRecipe] = useState<CurrentRecipeInfo | null>(null);

  return (
    <CurrentRecipeContext.Provider value={{ currentRecipe, setCurrentRecipe }}>
      {children}
    </CurrentRecipeContext.Provider>
  );
}

export function useCurrentRecipe() {
  const ctx = useContext(CurrentRecipeContext);
  if (!ctx) {
    throw new Error('useCurrentRecipe must be used within CurrentRecipeProvider');
  }
  return ctx;
}
