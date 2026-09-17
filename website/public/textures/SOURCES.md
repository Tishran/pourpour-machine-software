# Texture sources

Source: ambientCG / Lennart Demes. Downloaded September 15, 2026.

All source assets use [CC0 1.0 Universal](https://docs.ambientcg.com/license/), which permits modification and redistribution, including in commercial projects.

| Local files                                               | Source                                                                          | Use                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `brushed-metal-normal.jpg`, `brushed-metal-roughness.jpg` | [Metal010](https://ambientcg.com/view?id=Metal010), `Metal010_1K-JPG.zip`       | Brushed machining detail on metal rails, fittings, and scale                       |
| `surface-grain-normal.jpg`, `surface-grain-roughness.jpg` | [Plastic010](https://ambientcg.com/view?id=Plastic010), `Plastic010_1K-JPG.zip` | Microscopic coating grain, molded ABS, rubber and very weak glaze detail           |
| `filter-paper-color.jpg`, `filter-paper-normal.jpg`       | [Paper001](https://ambientcg.com/view?id=Paper001), `Paper001_1K-JPG.zip`       | Paper fibers on the filter, kraft bag and its label (material-specific tint/scale) |

## Material upgrade

No external assets or HDRIs were added. The same six 512 px JPEGs remain the
entire texture download (about 235 KiB). Reflection lighting uses a locally
generated studio environment, never a visible panorama.

`Materials.tsx` clones texture transforms per finish/UV scale. At load time it
derives 256 px linear roughness masks with narrow, preset-specific ranges;
Paper001 fiber luminance supplies an approximate paper roughness mask. These
runtime derivatives stay under the source assets' CC0 license and add no files
or network requests. They are disposed with the material provider. No
displacement, dust, scratches, or fingerprint assets were added.

Only the required maps are redistributed. They were resized from 1024 to 512 pixels with macOS `sips`, JPEG quality 82. Normal maps use the OpenGL convention and are treated as linear data, as are roughness maps. Paper base color uses sRGB. Texture repetition and normal strength are defined in `src/experience/materialPresets.ts` and configured in `Materials.tsx`. Original archives and unused maps are not shipped.
