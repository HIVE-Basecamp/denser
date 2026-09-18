/**
 * H.I.V.E.R. — moving around a card with a controller.
 *
 * A controller has no pointer. Everything a card offers — a mode to start, a
 * page to open, a close button — is a real button in the page, and the way to
 * reach one without a mouse is the browser's own idea of which thing is
 * chosen: focus. So the cross moves focus from one thing to the next and A
 * presses whatever is focused, which is how a console game has always worked.
 *
 * The functions here are the picking and the order. The polling that calls
 * them is in the frame loop, and the cards themselves only had to say which
 * element is the card: `data-hfu-panel`.
 */

/** Anything a person can press or type into. */
const REACHABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The card on top, or null when none is open.
 *
 * Cards are drawn in the order they are written, so the LAST one in the page
 * is the one over everything else and the one a press belongs to.
 */
export function topPanel(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  const all = root.querySelectorAll<HTMLElement>('[data-hfu-panel]');
  return all.length ? all[all.length - 1] : null;
}

/** Everything on that card that can be chosen, in the order it is drawn. */
export function reachable(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(REACHABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

/**
 * The next thing to choose, given what is chosen now.
 *
 * It wraps: past the last is the first again. Nothing chosen yet means the
 * first thing going forward and the last going back, so the very first press
 * lands somewhere sensible whichever way it was pushed.
 */
export function step(items: HTMLElement[], current: Element | null, forward: boolean): HTMLElement | null {
  if (!items.length) return null;
  const at = items.indexOf(current as HTMLElement);
  if (at < 0) return forward ? items[0] : items[items.length - 1];
  const next = (at + (forward ? 1 : -1) + items.length) % items.length;
  return items[next];
}

/** How the chosen thing is marked. The cards are dark, so a browser's own hairline is not enough. */
const RING = '2px solid #5df0ff';

/** Choose a thing: focus it, and ring it so the choice can be seen across the room. */
export function choose(el: HTMLElement, previous: HTMLElement | null): void {
  if (previous && previous !== el) {
    previous.style.outline = '';
    previous.style.outlineOffset = '';
  }
  el.style.outline = RING;
  el.style.outlineOffset = '2px';
  el.focus({ preventScroll: false });
}

/** Let go of a thing, when its card closes. */
export function unchoose(el: HTMLElement | null): void {
  if (!el) return;
  el.style.outline = '';
  el.style.outlineOffset = '';
}
