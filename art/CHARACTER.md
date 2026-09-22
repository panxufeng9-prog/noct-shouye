# Noct character specification

User reference: noct-character-reference.png. Dark blue fox, cyan eyes and pendant, white cheeks and tail tip, short navy cloak.

## Current atlas

dist/noct-walk-4dir.png is a transparent 256×192 PNG with twelve 64×64 cells.
- Row 0: four front/down walk frames.
- Row 1: four back/up walk frames.
- Row 2: four right-side walk frames; mirror for left.
- All frames use body/head center x32 and foot baseline y56, with a shared scale.
- Integer placement and nearest-neighbor sampling. No runtime reference-sheet segmentation.
- Idle preserves last direction with procedural pixel-layer breathing and secondary motion. Animation clock follows traveled distance and stops at arena boundaries.

Prepared from walking rows 2–4 of approved reference. Paper removal is flood-filled from each cell boundary to preserve enclosed white fur. Source regions and alignment logic retained in atlas-preparation.js. Original reference was not overwritten.

Movement only in this art revision. No new attack, damage, or death animation. Existing gameplay remains.

## Idle animation
- Independent idle clock; starts after a 0.22s settling interval.
- 2.8s breathing cycle, one-pixel upper-body expansion; bottom four opaque rows remain anchored.
- 2.05s tail motion cycle, one pixel, distinct from breath timing.
- Short blink after 3.9s idle; ear-tip compression near 5.8s.
- Cyan pendant pulse follows breathing. All three views supported; side mirrored for left.
- Input immediately resumes walk animation; pause freezes clocks and current walk/idle state.
- Pixel layers use integer destination positions and nearest-neighbor drawing.

## Stand and stop revision (v7)
- New noct-stand.png uses dedicated neutral front poses from reference row 8, plus neutral back and side from row 1. No walk-frame idle base.
- Idle boots are identical across every phase and rest on the same floor line.
- Motion states: walking → stop last step (75ms) → directional neutral → front settle → front idle. Return duration: down 220ms, side 340ms, back 440ms.
- Any movement input interrupts the return immediately. Physical position stops immediately; there is no forced sliding.
- Nine authored timing phases use four source idle poses, inhale/exhale holds, upper-body motion, delayed tail follow-through, and brief blinks.
- All idle paths now face front, superseding the earlier hold-last-direction behavior.

References: Pixel Joint breathing animation discussion https://pixeljoint.com/forum/forum_posts.asp?PID=188544&TID=19049 and Raymond Schlitter's idle breakdown https://www.slynyrd.com/blog/2024/9/26/pixelblog-52-idle-fighting-stance . Applied: stable base pose, coordinated torso/head movement, holds and unequal timing, secondary motion. Exact commercial-game idle implementation was not inferred from screenshots.
