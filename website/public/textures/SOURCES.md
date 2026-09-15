# Texture sources

Source: ambientCG / Lennart Demes. Downloaded September 15, 2026.

All source assets use [CC0 1.0 Universal](https://docs.ambientcg.com/license/), which permits modification and redistribution, including in commercial projects.

| Local files                                               | Source                                                                          | Use                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `brushed-metal-normal.jpg`, `brushed-metal-roughness.jpg` | [Metal010](https://ambientcg.com/view?id=Metal010), `Metal010_1K-JPG.zip`       | Brushed machining detail on metal rails, fittings, and scale    |
| `surface-grain-normal.jpg`, `surface-grain-roughness.jpg` | [Plastic010](https://ambientcg.com/view?id=Plastic010), `Plastic010_1K-JPG.zip` | Fine surface grain adapted to ceramic housings and molded parts |
| `filter-paper-color.jpg`, `filter-paper-normal.jpg`       | [Paper001](https://ambientcg.com/view?id=Paper001), `Paper001_1K-JPG.zip`       | Paper fibers on the V60 filter                                  |

Only the required maps are redistributed. They were resized from 1024 to 512 pixels with macOS `sips`, JPEG quality 82. Normal maps use the OpenGL convention and are treated as linear data, as are roughness maps. Paper base color uses sRGB. Texture repetition and normal strength are tuned in `src/experience/Materials.tsx`. Original archives and unused maps are not shipped.
