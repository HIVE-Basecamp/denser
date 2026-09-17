'use client';

/**
 * H.I.V.E.R. — the game takes over the whole screen.
 *
 * The map normally lives in a box inside the page, so on a big monitor you
 * play a small game inside a large screen. This hands one element to the
 * browser's own full screen, which is the only way a web page is allowed to
 * cover the screen: the browser does it, we only ask.
 *
 * Two things are worth knowing:
 *
 * - The browser will only grant it from a real click. Calling `enter` from a
 *   timer or on load does nothing, by design, and that is why there is a
 *   button rather than an automatic switch.
 * - Some browsers (older Safari, and every browser on iPhone) either use the
 *   old `webkit` spelling or cannot do this to a plain element at all. Both
 *   are handled: `supported` is false where it cannot happen, and the button
 *   is not drawn rather than drawn dead.
 *
 * Nothing is stored and nothing is remembered between visits. Leaving full
 * screen with Escape, or by any other route, still reports back here, because
 * the state is read from the document rather than from our own click.
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * The same document, with the spelling older browsers use. TypeScript's own
 * DOM types already know `webkitFullscreenElement`, so only the exit needs
 * declaring here.
 */
interface LegacyDocument extends Document {
  webkitExitFullscreen?: () => Promise<void> | void;
}

/** The same element, with the spelling older browsers use. */
interface LegacyElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

function currentElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as LegacyDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export interface Fullscreen {
  /** True while the given element is the one covering the screen. */
  on: boolean;
  /** False where the browser cannot do this at all; draw no button then. */
  supported: boolean;
  /** Go full screen, or come back. Safe to call either way. */
  toggle: () => void;
}

export function useFullscreen(ref: React.RefObject<HTMLElement>): Fullscreen {
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const el = ref.current as LegacyElement | null;
    setSupported(Boolean(el && (el.requestFullscreen || el.webkitRequestFullscreen)));
  }, [ref]);

  // One listener for both spellings. The document is the truth: Escape, the
  // browser's own button and our button all end up here.
  useEffect(() => {
    const read = () => setOn(currentElement() === ref.current);
    document.addEventListener('fullscreenchange', read);
    document.addEventListener('webkitfullscreenchange', read);
    return () => {
      document.removeEventListener('fullscreenchange', read);
      document.removeEventListener('webkitfullscreenchange', read);
    };
  }, [ref]);

  const toggle = useCallback(() => {
    const el = ref.current as LegacyElement | null;
    if (!el) return;
    const doc = document as LegacyDocument;
    // A refused request is not a fault worth shouting about: the screen simply
    // stays as it was, so the rejection is swallowed rather than thrown.
    if (currentElement() === el) {
      const exit = doc.exitFullscreen ? doc.exitFullscreen.bind(doc) : doc.webkitExitFullscreen?.bind(doc);
      void Promise.resolve(exit?.()).catch(() => undefined);
      return;
    }
    const enter = el.requestFullscreen ? el.requestFullscreen.bind(el) : el.webkitRequestFullscreen?.bind(el);
    void Promise.resolve(enter?.()).catch(() => undefined);
  }, [ref]);

  return { on, supported, toggle };
}
