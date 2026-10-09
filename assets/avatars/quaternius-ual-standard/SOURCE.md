# Quaternius Universal Animation Library — Standard

Author: Quaternius. License: **CC0 1.0**, full text next to `LICENSE`.

Official source and terms: https://quaternius.com/packs/universalanimationlibrary.html

The free Standard edition is published by the author at https://quaternius.itch.io/universal-animation-library. Pro and Source are separate paid editions; they are not used.

Here is a public glTF copy of the **free Standard from 2025-06**, not the latest edition of 2026. The mirror reports the author, editor and CC0: https://github.com/J-Ponzo/gltf-universal-animation-library. The files are taken from a committed commit `e24c23cf2a1323488a3faa226ea7ea21f644b73e`.

| File | SHA-256 |
| --- | --- |
| AnimationLibrary_Godot_Standard.gltf | 0ff075c7ad6855c5c2c37a171592ee8f0d6ab2f58259e2be77a9b63dd8027765 |
| AnimationLibrary_Godot_Standard.bin | 6e65377d81558333c4093dbb144a48fd19019343d82b1a3a7992a98ec0e0543c |
| LICENSE | a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499 |

`scripts/quaternius-avatar-motion.mjs` only uses `Idle_Loop` and `Jog_Fwd_Loop`. The mannequin serves as a reference rig for motion transfer. Its mesh, weapons and other clips are not exported to our characters and are not loaded by the browser. The silhouettes and three costumes remain their own models according to the approved `three-skins-v5.png`.

The transfer is performed during assembly: world-space rotation relative to the bind pose, coordination of axes and proportions, height correction along the soles, closing cycles. Blinking and secondary movement of the apron/chain were added by us. The result is self-contained GLBs with common bone names and Idle/Run clips, no root motion and no dependence on the camera/rules of a specific game.
