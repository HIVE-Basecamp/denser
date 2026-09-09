/**
 * HIVE COMB HOME (was the Rose Window). Bryan: "go look at real images of
 * honeycombs... nature gives you the answer. just go mimic a real honey
 * comb. but keep the fun color changing." So this is a REAL comb now: one
 * wax slab hanging from a branch, cells hex-PACKED and sharing walls the
 * way bees actually build - centre cell, a ring of six honey cells, and an
 * outer ring of twelve where the ten link panes live in their stained-glass
 * colors (the two spare cells are wax-capped). Slight waviness and a slow
 * breath keep it organic; honey drips off the bottom edge and one bee is
 * always on patrol.
 */

/** Hex-cell size of the comb (centre-to-corner), in units of the window R. */
export const COMB_S = 0.26;

/**
 * The twelve outer comb slots in pane order, clockwise from the top. Panes
 * fill these first; whatever slots are left over stay wax-capped, so the
 * comb absorbs new links without redesign (Bryan keeps moving icons in).
 */
export function combSlots(R: number): { x: number; y: number; deg: number }[] {
  const ring2 = combSpots(R)
    .filter((sp) => sp.ring === 2)
    .sort((a, b) => ((a.deg + 90) % 360) - ((b.deg + 90) % 360));
  // THE GROWTH ROW: four cells built onto the comb's bottom edge, left to
  // right, the way a real comb extends downward. Panes overflow into these
  // once the twelve ring slots are full (Bryan keeps moving links in).
  const d = Math.sqrt(3) * COMB_S * R;
  const growth = [-1.5, -0.5, 0.5, 1.5].map((gx, i) => ({
    x: gx * d,
    y: 2.598 * d,
    deg: 500 + i * 37
  }));
  return [...ring2, ...growth];
}

/** All eighteen non-centre cell spots of the comb, hex-grid honest. */
export function combSpots(R: number): { x: number; y: number; ring: 1 | 2; deg: number }[] {
  const s = COMB_S * R;
  const d = Math.sqrt(3) * s; // neighbour centre distance
  const spots: { x: number; y: number; ring: 1 | 2; deg: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const ca = (Math.PI / 180) * (i * 60);
    spots.push({ x: Math.cos(ca) * d, y: Math.sin(ca) * d, ring: 1, deg: i * 60 });
    spots.push({ x: Math.cos(ca) * 2 * d, y: Math.sin(ca) * 2 * d, ring: 2, deg: i * 60 });
    const ea = (Math.PI / 180) * (i * 60 + 30);
    spots.push({
      x: Math.cos(ea) * Math.sqrt(3) * d,
      y: Math.sin(ea) * Math.sqrt(3) * d,
      ring: 2,
      deg: i * 60 + 30
    });
  }
  return spots;
}

/** The ten pane cells, clockwise from the top. Shared by drawing, the
 *  label pass and the click hit test, so glass and target never drift. */
export function rosePaneCentre(k: number, count: number, R: number): { x: number; y: number } {
  const slots = combSlots(R);
  const sp = slots[k % slots.length];
  return { x: sp.x, y: sp.y };
}
