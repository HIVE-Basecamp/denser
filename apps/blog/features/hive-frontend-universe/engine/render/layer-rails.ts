import type { WorldEdge } from '../world';
import { PALETTE } from './palette';
import type { Pass } from './pass';

/**
 * The transit network: the wobbled streets, the molten flow running down
 * them, and the named route lines drawn over the top.
 */
export function drawRails(p: Pass): void {
  const { scene, ctx, edges, time, mapness, z, edgeVis } = p;

  // The lines: wobbled curves. Mesh in teal, spokes in violet. At far zoom
  // the wobble detail is sub-pixel, so the polylines are decimated (and the
  // joins simplified), which keeps the pulled-out map fast on weak hardware.
  const stride = z < 0.1 ? 8 : z < 0.3 ? 4 : 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = stride > 2 ? 'bevel' : 'round';
  const strokeEdge = (e: WorldEdge) => {
    ctx.beginPath();
    ctx.moveTo(e.pts[0], e.pts[1]);
    for (let i = stride; i < e.pts.length - 2; i += stride) ctx.lineTo(e.pts[i], e.pts[i + 1]);
    ctx.lineTo(e.pts[e.pts.length - 2], e.pts[e.pts.length - 1]);
    ctx.stroke();
  };
  for (const kind of ['mesh', 'spoke'] as const) {
    ctx.strokeStyle = kind === 'mesh' ? PALETTE.mesh : PALETTE.spoke;
    // ANY line you are meant to travel along has to look travelable. Pass
    // seven thinned these to 1.8px to push the named routes forward, which
    // went too far: the streets read as hairlines you would not think to ride.
    // Streets are fat where you ride them and slimmer on the pulled-out map,
    // where nobody is travelling and the extra fill was costing real frame time.
    // Thicker and brighter again, and the whole network BREATHES: a slow
    // alpha pulse offset per stroke family makes the map read as a living
    // thing rather than a printed one. One alpha per family costs nothing.
    // LAVA STREETS (Bryan's order): slightly thicker than the pass-17 spec
    // and hot; they stay visible at map zoom now (the old fade-out is mostly
    // gone) because a lava vein network IS the map texture he wants.
    const baseW = kind === 'mesh' ? 3.9 : 3.5;
    const streetW = z < 0.12 ? Math.max(baseW * 0.55, 2.8) : baseW;
    ctx.lineWidth = streetW / Math.max(z, 0.05);
    // SHIMMER, take two (Bryan: "its like you changed nothing"). The first
    // version shared one alpha per stroke FAMILY, so the entire network still
    // dimmed and brightened in unison: a pulse with extra steps. Now every
    // SEGMENT flickers on its own clock, dim-only from a steady base: the
    // network as a whole never breathes, but sparkle runs across it like
    // heat over coals. Two incommensurate sines multiplied keep each dip
    // brief and shallow; the per-edge globalAlpha write costs nothing next
    // to the stroke itself.
    const baseA = (kind === 'mesh' ? 0.86 : 0.78) * (1 - mapness * 0.25);
    for (const e of edges) {
      if (e.kind !== kind || !edgeVis(e)) continue;
      const ph = (e.id % 31) * 0.83;
      const tw =
        (0.5 + 0.5 * Math.sin(time * 8.3 + ph * 2.7)) * (0.5 + 0.5 * Math.sin(time * 13.1 + ph));
      ctx.globalAlpha = baseA - 0.16 * tw;
      strokeEdge(e);
    }
  }
  ctx.globalAlpha = 1;

  // THE MOLTEN FLOW: bright yellow-hot packets running down every street,
  // one animated dash pass over both families. This is what makes the veins
  // read as MOVING lava rather than painted orange, at both zooms.
  {
    const zz = Math.max(z, 0.05);
    ctx.setLineDash([42 / zz, 250 / zz]);
    ctx.lineDashOffset = -((time * 150) % 292) / zz;
    ctx.strokeStyle = '#ffd63a';
    ctx.lineWidth = 2.1 / zz;
    ctx.globalAlpha = 0.5 + mapness * 0.25;
    // At map zoom every street is on screen and a second stroke of all of
    // them broke the 12ms law; one edge in four still reads as a living
    // network at that height (measured, not guessed).
    const flowSkip = z < 0.12;
    for (const e of edges) {
      if (!edgeVis(e) || (flowSkip && (e.id & 3) !== 0)) continue;
      strokeEdge(e);
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.globalAlpha = 1;
  }

  // THE POST LINE: the first subway route. A labeled subset of the mesh
  // edges drawn noticeably thicker in one warm saturated colour, with a soft
  // under-glow, clearly distinct from ordinary lines at both zooms.
  //
  // Three passes, which is what guarantees the line reads against EVERY region
  // it crosses rather than just against the average one: a dark casing that
  // separates it from whatever tone is underneath, a soft glow, then the gold
  // core on top.
  // On the pulled-out map the casing and glow passes are sub-pixel decoration
  // but cost a full stroke of every route edge each. Since pass seven the post
  // line spans the whole world (roughly 110 edges rather than 45) and there are
  // two lines, so the three-pass treatment measured about 6ms of the frame at
  // map zoom. Collapsing to a single fatter core pass there is invisible and
  // pays for itself.
  const routeLod = z < 0.12;
  let layerPhase = 0;
  for (const layer of scene.routeLayers) {
    if (!layer.edges.size) continue;
    // SHIMMER on the named lines too, per SEGMENT like the streets now: the
    // whole-layer alpha of the first attempt made each line throb as one
    // piece, which is the pulsing Bryan keeps vetoing. Constant width; the
    // travelling electricity stays the big motion, this is the heat haze
    // under it.
    layerPhase += 2.1;
    // At map zoom the line keeps its CASING: a dark edge is the one signal
    // that says "designed transit route" instead of "loose wire", and it is
    // what stops the long line reading as a scribble. The always-on glow pass
    // is dimmed everywhere; the travelling electricity is the line's life
    // now, and a glow that never rests is just noise.
    const passes = routeLod
      ? [
          { col: layer.casing, w: layer.width * 1.55, a: 0.9 },
          { col: layer.core, w: layer.width * 1.15, a: 1 }
        ]
      : [
          { col: layer.casing, w: layer.width * 1.98, a: 0.85 },
          // Halo capped near half the core width: most of gold's former
          // overweight was bloom, not stroke (design synthesis, item 1).
          { col: layer.glow, w: layer.width * 1.3, a: 0.18 },
          { col: layer.core, w: layer.width, a: 1 }
        ];
    if (layer.dash) ctx.setLineDash(layer.dash.map((d) => d / Math.max(z, 0.05)));
    for (const p of passes) {
      ctx.strokeStyle = p.col;
      ctx.lineWidth = p.w / Math.max(z, 0.05);
      for (const e of edges) {
        if (!layer.edges.has(e.id) || !edgeVis(e)) continue;
        const ph = (e.id % 29) * 0.91;
        const tw =
          (0.5 + 0.5 * Math.sin(time * 7.9 + ph * 2.3)) *
          (0.5 + 0.5 * Math.sin(time * 12.3 + ph));
        ctx.globalAlpha = Math.max(0.1, p.a - 0.14 * tw);
        strokeEdge(e);
      }
    }
    ctx.globalAlpha = 1;
    if (layer.dash) ctx.setLineDash([]);
    // THE ELECTRICITY: bright charge packets running along the line, one
    // extra dashed pass with its offset animated. Subtle while riding, vivid
    // on the pulled-out map, which is where the network should visibly hum.
    // Each edge restarts the pattern at its own start, but the offsets all
    // move together, so the eye reads one continuous circulation.
    if (layer.spark) {
      const zz = Math.max(z, 0.05);
      ctx.setLineDash([34 / zz, 300 / zz]);
      ctx.lineDashOffset = -((time * 260) % 334) / zz - layerPhase * 40;
      ctx.strokeStyle = layer.spark;
      ctx.lineWidth = (layer.width * 0.62) / zz;
      ctx.globalAlpha = 0.3 + mapness * 0.7;
      for (const e of edges) {
        if (!layer.edges.has(e.id) || !edgeVis(e)) continue;
        strokeEdge(e);
      }
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }
  }
  ctx.globalAlpha = 1;
}
