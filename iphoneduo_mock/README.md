# Pourpour Duo Studio

A standalone Three.js iPhone Duo reconstruction with the supplied coffee recording.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates `dist/`; `npm run preview` serves that build. `npm test` verifies the UV crop and hinge continuity.

The default experience automatically plays a cinematic sequence: a 14-second rear-to-front reveal and gentle opening, followed by the complete recording while the hinge slowly finishes opening. The first video frame stays held during the reveal so none of the recording is skipped. A metallic Apple mark sits on the rear glass. Motion uses easing with zero endpoint velocity and acceleration, with subtle drift throughout playback; the final pose is held at the end.

Pause/play controls both motion and video. **Replay animation** restarts the sequence. **Explore freely**, dragging, or the fold slider switches to manual control. Open `/?mode=manual` to start directly in the previous manual experience. Drag to orbit, scroll/pinch to zoom, and use the slider or presets to fold. Finish swatches, reset view, fullscreen, mute, and local video replacement are available. Uploads stay in the browser.

## Screen behavior

One HTML video element supplies one shared Three.js VideoTexture. In manual mode, closed playback holds at the first decoded frame at or after 3.8 seconds. Crossing 8 degrees transfers the material to the inner screen and resumes the same video element without seeking. Closing again holds the current frame if playback is already beyond the preview interval: it does not rewind on folding. The cinematic sequence bypasses this preview hold and runs the entire recording after the introduction. Its motion follows media time, so pausing or buffering cannot let the phone advance ahead of the video. Explicit replay can rewind; folding never does.

Both displays use centered aspect-preserving cover cropping. This retains portrait orientation with no stretching or empty bars, but necessarily crops content when source and display aspect ratios differ. Display surfaces have rounded geometry boundaries, with no oversized video planes. The inner screen bends through a continuous arc with fixed UVs, keeping the texture attached to the surface. As the device unfolds, the complete enclosure turns clockwise into portrait; the inner UVs are counter-oriented so the recording is upright in the final pose.

Hardware is fixed independently of the recording in `src/device.js`, using [Apple's Duo specifications](https://www.apple.com/iphone-duo/specs/): 164.6 × 117.8 mm open, 84.1 × 117.8 mm closed, 5.2 mm leaf thickness and 11.3 mm closed depth. Display dimensions derive from the published resolutions and pixel densities: 1398 × 2034 at 460 ppi outside; 2670 × 1878 at 430 ppi inside in the book pose. The model has the Duo's broad passport proportions, dual rear cameras and Star White / Night Sky finishes. Small hardware details and the hinge housing remain procedural approximations rather than manufacturer CAD. Never resize this hardware based on video metadata: only UV cropping changes when media is replaced.

The default video is `public/coffee-duo-full.mp4`: the entire original recording, fitted proportionally inside a 1440 × 2048 canvas with a matching cream background. Every source-frame edge stays inside both screens, including their rounded corners and the cover-camera safe area. The source timeline, camera steps, browser chrome, scrolling, recipe details and audio are retained. The original `public/coffee-demo.mp4` (approximately 69 MB) is unchanged. **Use your video** can still load another recording locally.

Rebuild the full version with `node scripts/fit-full-video.mjs`. The source frame is uniformly scaled by exactly 2/3, never stretched or cropped. Four animated orange/white tap indicators mark Take a photo, the shutter, Use Photo and Start brewing. These are editorial annotations timed from visible UI transitions, not captured touch telemetry. They are baked into the same video, so they follow its playback and the screen's UVs during folding. `public/coffee-duo-full.json` documents the source placement and tap times. The matching background fills the space beside the narrower source frame; the device geometry stays fixed.

The earlier condensed edit remains available as `public/coffee-duo-edit.mp4`, rebuilt with `node scripts/edit-coffee.mjs`. It is no longer the default because it omits parts of the original recording.

Video format support depends on the browser. For deployment, serve MP4 with byte-range support. UI fonts use Google Fonts with local sans-serif fallbacks.
