import { useEffect, useState, useCallback } from "react";

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retries?: number;
  timeout?: number;
}

/**
 * Hook mejorado para llamadas async con retry y timeout
 */
export const useAsync = <T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  options: UseAsyncOptions = {},
) => {
  const { onSuccess, onError, retries = 3, timeout = 15000 } = options;

  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Función para ejecutar con retry y timeout
  const execute = useCallback(async () => {
    setStatus("pending");
    setValue(null);
    setError(null);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Crear promise con timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeout),
        );

        const result = await Promise.race([asyncFunction(), timeoutPromise]);

        setValue(result);
        setStatus("success");
        onSuccess?.(result);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.log(
          `Attempt ${attempt + 1}/${retries + 1} failed:`,
          lastError.message,
        );

        // Exponential backoff: esperar más tiempo entre intentos
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 500),
          );
        }
      }
    }

    setError(lastError);
    setStatus("error");
    onError?.(lastError || new Error("Unknown error"));
  }, [asyncFunction, retries, timeout, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
};
