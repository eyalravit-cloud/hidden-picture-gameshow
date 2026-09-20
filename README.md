# Hidden Picture Gameshow

A self-contained, TV-studio-styled "Hidden Picture" gameshow app built with
plain HTML, CSS, and vanilla JavaScript — no build step, no dependencies.

## Run it

Just open `index.html` in a browser, or serve the folder:

```
npx serve hidden-picture-gameshow
```

## Features

- Start screen to enter Player 1 / Player 2 names, upload an image (or paste
  a URL), and choose a 4×4 or 5×5 grid.
- TV-shaped game board with glassmorphism scoreboards, neon glow accents,
  and a scanline/vignette overlay for a broadcast feel.
- Click a tile to reveal the picture underneath with a 3D scale/rotate
  animation.
- Score buttons (+/-) per player with a bounce animation on change.
- Host controls: **Reveal All** (cascading reveal of remaining tiles),
  **Next Round** (reset grid + upload a new image, keep scores/names), and
  **Reset Game** (return to start screen, clear everything).
- Fully responsive layout for desktop and tablet.

## Files

- `index.html` — markup for the start screen and game screen.
- `styles.css` — all styling, animations, and responsive rules.
- `script.js` — game state, tile grid generation, scoring, and controls.
