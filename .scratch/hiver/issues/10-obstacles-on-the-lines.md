# Obstacles on the lines

Type: grilling
Status: resolved
Blocked by: none

## Question

Should things sit on the lines that the bug must hop over or route around, blocking sight, so the hop has a job every second?

## Answer

"Yes try it." Build: ticket 17. Seam already in code: `engine/scenery.ts` cubes are marked "obstacle placeholders later"; the hazards pattern (world acts on the bug, `movement.ts` untouched) is the model.
