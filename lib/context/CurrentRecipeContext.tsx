'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface CurrentRecipeInfo {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string | null;
  notes: string | null;
}

// Turbopack/webpack can duplicate small shared modules into more than one
// route chunk, which gives each copy its own `createContext()` identity —
// a React Context provider mounted from one chunk's copy is then invisible
// to a consumer using another chunk's copy of "the same" context. Storing
// state on `globalThis` sidesteps that: there is only ever one JS global
// object, so every copy of this module reads/writes the same value
// regardless of which chunk it was bundled into.
declare global {
  // eslint-disable-next-line no-var
  var __mealbrainCurrentRecipe: CurrentRecipeInfo | null | undefined;
  // eslint-disable-next-line no-var
  var __mealbrainCurrentRecipeListeners: Set<() => void> | undefined;
}

function getListeners(): Set<() => void> {
  if (!globalThis.__mealbrainCurrentRecipeListeners) {
    globalThis.__mealbrainCurrentRecipeListeners = new Set();
  }
  return globalThis.__mealbrainCurrentRecipeListeners;
}

function getSnapshot(): CurrentRecipeInfo | null {
  return globalThis.__mealbrainCurrentRecipe ?? null;
}

function getServerSnapshot(): CurrentRecipeInfo | null {
  return null;
}

function subscribe(callback: () => void) {
  const listeners = getListeners();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setCurrentRecipeGlobal(recipe: CurrentRecipeInfo | null) {
  globalThis.__mealbrainCurrentRecipe = recipe;
  getListeners().forEach((cb) => cb());
}

export function useCurrentRecipe() {
  const currentRecipe = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setCurrentRecipe = useCallback(setCurrentRecipeGlobal, []);
  return { currentRecipe, setCurrentRecipe };
}
