import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useLocalStorage — reads/writes a value to localStorage.
 * initialValue can be a value or a factory function (() => value).
 * Factory is only called once (on mount) to avoid UUID regeneration.
 */
function useLocalStorage(key, initialValue) {
  const initialValueRef = useRef(initialValue);

  const readValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    } catch {
      // malformed — fall through
    }
    // Generate initial value
    const init = initialValueRef.current;
    const value = typeof init === 'function' ? init() : init;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage quota exceeded — ignore
    }
    return value;
  }, [key]);

  const [storedValue, setStoredValue] = useState(readValue);

  const setValue = useCallback(
    (value) => {
      try {
        const newValue = typeof value === 'function' ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);
      } catch {
        console.warn(`useLocalStorage: failed to set "${key}"`);
      }
    },
    [key, storedValue]
  );

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key) {
        setStoredValue(readValue());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, readValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
