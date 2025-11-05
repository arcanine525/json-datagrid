
// FIX: To resolve the "Cannot find namespace 'React'" error, we import the `Dispatch` and `SetStateAction` types
// directly and use them in the function signature, instead of using the `React` namespace.
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom React hook that persists state in the browser's localStorage.
 * It functions similarly to `useState`, but automatically saves the value to localStorage
 * whenever it changes and retrieves it on initial render.
 * @template T The type of the value to be stored.
 * @param key The key under which the value is stored in localStorage.
 * @param initialValue The initial value to use if no value is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
export function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore = storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}