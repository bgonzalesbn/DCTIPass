import { useEffect, useRef, useState } from "react";

/**
 * Hook para debouncing de valores (evita múltiples cambios rápidos)
 * Útil para búsquedas y filtros
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para infinite scroll (cargar más cuando se llega al bottom)
 */
export const useInfiniteScroll = (callback: () => void, threshold = 0.1) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      { threshold },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [callback, threshold]);

  return observerTarget;
};

/**
 * Hook para prefetch de datos (cargar datos antes de que se necesiten)
 */
export const usePrefetch = (fetchFn: () => Promise<any>, delay = 2000) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFn().catch(() => {
        // Silenciosamente fallar si prefetch no funciona
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [fetchFn, delay]);
};

/**
 * Hook para memoizar datos en localStorage (caché persistente)
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item =
        typeof window !== "undefined"
          ? window.localStorage?.getItem(key)
          : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage?.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};
