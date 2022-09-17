import { useEffect } from "react";

export const useDebouncedEffect = (effect: any, deps: any[], delay: number) => {
  useEffect(() => {
    const handler = window.setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...(deps || []), delay]);
}