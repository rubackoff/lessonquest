# Avatar material atlas

`reference-materials-source.png` is the original neutral 4×4 detail atlas generated with built-in Image Gen on 2026-10-06. The exact prompt is saved in `reference-materials.prompt.txt`.

`reference-materials.png` is its 384×384, 32-colour PNG runtime conversion. Reproduce from the project root:

```powershell
node --input-type=module -e 'import sharp from "sharp"; await sharp("assets/avatars/materials/reference-materials-source.png").resize(384,384).png({palette:true,colours:32}).toFile("assets/avatars/materials/reference-materials.png")'
node scripts/build-blocky-avatars.mjs
```

The exporter maps individual surfaces into atlas tiles, then embeds the PNG in each GLB. Vertex colours provide the actual outfit palette. Skin and facial details use an untextured material. Hair, hoodie, trousers and tactical panels use the plain tile; fabric grain is deliberately limited to quilted sleeves, apron, leather and small material details. This image supplies surface detail to real meshes; it is not a character image or a substitute for geometry.
