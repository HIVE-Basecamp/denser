'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The rendered width of an element, kept current as it resizes. Zero until
 * measured, so a caller can tell "not yet" from "narrow".
 *
 * The ref is a callback, not a ref object: the element it measures may mount
 * after the first render (a feed shows a skeleton first), and an effect that
 * ran once at mount would never see it arrive.
 */
export function useElementWidth<T extends HTMLElement>(): { ref: (node: T | null) => void; width: number } {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  const ref = useCallback((node: T | null) => setElement(node), []);

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    // Layout width, not the painted box: a transform or zoom animation on the
    // element must not change what size its rows are drawn at.
    setWidth(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { ref, width };
}
