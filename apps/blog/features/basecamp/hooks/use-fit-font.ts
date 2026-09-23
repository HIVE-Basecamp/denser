'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * One line of text that is never cut short: it gives up type size instead.
 *
 * The text is measured at its full size against the box it sits in, and when
 * it is wider than the box the size is scaled down as far as the floor. It is
 * measured again whenever the box changes width, so a feed that narrows shrinks
 * the text and one that widens lets it back up. The first paint is at full
 * size; only a text that would not have fit ever changes.
 */
export function useFitFont<TBox extends HTMLElement, TText extends HTMLElement>(
  text: string,
  maxPx: number,
  minPx: number
): { boxRef: RefObject<TBox>; textRef: RefObject<TText>; fontSize: number } {
  const boxRef = useRef<TBox>(null);
  const textRef = useRef<TText>(null);
  const [fontSize, setFontSize] = useState(maxPx);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const element = textRef.current;
    if (!box || !element) return;

    const fit = () => {
      element.style.fontSize = `${maxPx}px`;
      // Painted widths, not scrollWidth: the text is an inline span, and an
      // inline element's scrollWidth is always zero.
      const need = element.getBoundingClientRect().width;
      const room = box.getBoundingClientRect().width;
      const next = need > room && need > 0 ? Math.max(minPx, Math.floor((maxPx * room) / need)) : maxPx;
      // Written straight to the element as well as to state: when the answer
      // is the same as last time React has nothing to re-render, and the
      // measuring size above would be left behind.
      element.style.fontSize = `${next}px`;
      setFontSize(next);
    };

    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text, maxPx, minPx]);

  return { boxRef, textRef, fontSize };
}
