# Growth timeline assets

The site widget and preview screenshots use `assets/timeline-data.json`. Use the known date precision for each event; keep offline research distinct from deployed features. Never add local proof images or credentials to this public data.

To regenerate the GitHub previews, install Playwright with a Chromium browser and Pillow in your development environment, then run:

```sh
node scripts/render-timeline.cjs
python scripts/encode-timeline.py .timeline-preview
```

`GT_PREVIEW_DIR` can select another working directory; `PLAYWRIGHT_CHANNEL=msedge` can use an installed Edge browser. Copy the four generated `assets/timeline-preview-*` files to the profile repository's `assets/` directory. The renderer captures the actual widget rather than maintaining a second event list. Its highlighted frames are selected by stable event IDs; the full site contains all events. Add or replace highlight IDs in the renderer when curating a different preview.

The site loads the interactive widget progressively. Without JavaScript, or when data loading fails, the HTML list remains available. The renderer also regenerates this fallback list from the JSON data. Animation playback is opt-in, stops when the page is hidden, and respects reduced-motion preferences. The README displays static PNGs for reduced-motion preferences.
