# N64 Browser Player

A static browser player for your own Super Smash Bros. 64, The Legend of Zelda: Ocarina of Time, and other Nintendo 64 ROMs. Inspired by johto-gold-player. No ROMs are distributed; published mods contain BPS differences and metadata.

## Play

Select a game (or Auto-detect), choose an uncompressed `.z64`, `.v64`, or `.n64`, and start. Byte-swapped ROM formats are normalized locally. A controller and a recent desktop browser with WebGL are recommended. The page does not upload ROMs. EmulatorJS downloads from its official stable CDN, so internet is required.

Use the emulator menu for keyboard/controller mappings, up to four controller assignments, save states, and save download/upload. Touch controls can be enabled before starting. Actual gameplay, performance, and multiplayer are not yet verified with either commercial game.

## Saves

Use the game's normal save feature. The player attempts a filesystem sync every five seconds while visible and on switching away. Wait for a successful storage message before closing; closing a tab cannot guarantee asynchronous writes finish. Download backups through the emulator menu. Browser storage can be erased or unavailable in private browsing.

The normalized ROM's SHA-256 is the emulator game name, separating saves by exact ROM content. Equivalent byte orders share a save; different revisions and future patches do not. Save states depend on the emulator core and ROM version. The CDN stable version can change; compatibility across emulator updates is not guaranteed.

## Development

No install or build needed. Use Node 22+ for `npm test`. Serve this directory over localhost, e.g. `python3 -m http.server 8000`, and visit `http://localhost:8000`. HTTPS or localhost is required for ROM hashing and controller APIs. The N64 core uses single-threaded mode so GitHub Pages does not need cross-origin isolation headers.

## GitHub Pages

Push to a new repository's `main` branch. In Settings → Pages, select **GitHub Actions** as the source. The workflow tests ROM normalization and save identities, stages only website files, and deploys. Artifact names include the run attempt to support reruns. Pull requests run tests without deploying.

## Scope and validation

The player loads original ROMs, local BPS patches, and versioned published mods. Published mods for Ocarina of Time USA Rev B (NTSC 1.2) include Mario-style Child Character v0.1.1 (new head/body meshes, geometric M badge, gloves and overalls; fixes the v0.1.0 opening drawbridge freeze) and Child Link Purple Tunic v0.1.0 (original mesh with a purple tint). The Mario-style model retains Link’s body animations, voice, abilities and equipment; facial features are static. Original ROM byte orders are normalized before integrity checks and patch application. Automated tests use synthetic headers, not game ROMs. The purple-tunic release was compiled from the pinned decompilation, reconstructed byte-for-byte with the browser BPS decoder, and visually checked in the actual browser emulator using a local test save. Full playthrough, long-term save persistence, mobile performance, and physical controller testing remain unverified. EmulatorJS is an external runtime; see [EmulatorJS](https://emulatorjs.org/) for its source, licenses and core documentation.

Mario v0.1.1 uses less object memory than vanilla child Link, with a compiled budget check. Its original opening nightmare has been verified to progress past the rainy drawbridge to Kokiri Forest in the browser emulator. Start a new game on v0.1.1; avoid loading emulator save states from v0.1.0. The earlier patch remains available with a known-issue warning.

An optional **Mario + Expansion Memory (Experimental) v0.2.0** variant reserves a 2 MiB scene-object bank in Expansion Pak RAM. The browser core provides 8 MiB by default. The model looks the same as Mario v0.1.1; the extra memory is for future assets. Fresh-opening and gameplay/pause checks pass, while full playthrough and physical N64 testing remain unverified. Start a new game and avoid other versions’ emulator save states.
