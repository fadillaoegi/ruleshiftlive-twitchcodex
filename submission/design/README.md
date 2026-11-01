# RuleShift Live - promotional artwork

Original English artwork matched to the app: navy grid, neon cyan/pink,
the existing lightning logo, the original game sprite and actual captured
gravity-reversal gameplay. No synthetic gameplay, fabricated Twitch interface,
paid image generation or third-party stock assets are included.

## Upload-ready files

| File | Use | Dimensions |
| --- | --- | --- |
| `youtube-thumbnail.jpg` | Main YouTube custom thumbnail | 3840 x 2160, 16:9 |
| `youtube-thumbnail-1280.jpg` | Smaller alternative | 1280 x 720, 16:9 |
| `devpost-cover.jpg` | Devpost project gallery thumbnail | 1800 x 1200, 3:2 |
| `poster-a3.jpg` | Digital / print poster | 3508 x 4961, approximately 300 dpi at A3 |
| `../documents/ruleshift-live-poster-a3.pdf` | A3 print-ready poster | One A3 page |
| `../documents/ruleshift-live-project-brief.pdf` | Supporting project brief | Four A4 pages |

PNG masters are in `masters/`. The poster's QR code opens
https://youtu.be/AvWHm6U2jUs. Screen images are actual app footage, cropped and
placed in an illustrative perspective frame. Oversized coin/sprite decorations
are promotional illustrations. The source image and footage evidence are
separate from the public idle-app broadcast excerpt.

## Platform requirements checked November 1, 2026

- [YouTube thumbnail guidance](https://support.google.com/youtube/answer/72431?hl=en)
  recommends 3840 x 2160, JPG/PNG and 16:9. Both supplied JPEGs are below the
  stricter 2 MB mobile upload cap (desktop guidance allows 50 MB).
- [Devpost submission guidance](https://help.devpost.com/article/126-know-your-submission-steps)
  recommends 3:2 for project-gallery thumbnails and allows JPG/PNG/GIF under
  5 MB. The supplied cover is below that cap.
- [Competition rules](https://twitchcon-codex.devpost.com/rules) require an
  English project explanation, repository access, principal Codex session and
  a YouTube demonstration under three minutes showing the project on Twitch
  and development with Codex. The 02:42 local final edit fits that duration.
  The poster and PDF are supporting materials, not additional prescribed
  deliverables or proof that all entry/eligibility checks are complete.

The user supplied the YouTube URL. Official YouTube oEmbed metadata was
reachable without signing in and returned the expected title/channel; see
`source/youtube-oembed.json`. Complete playback and equivalence to the local
final MP4 have not been verified. The brief now links to the user-supplied public
repository at https://github.com/fadillaoegi/ruleshiftlive-twitchcodex. Public
GitHub metadata and README retrieval passed; remote completeness and independent
installation have not been audited. The recorded Codex
session still needs entrant confirmation as the principal build thread.

## Reproduce

1. In `submission/video/remotion`, install the locked dependencies with `npm ci`.
2. Run `node scripts/render-design.mjs` and `npm run typecheck` there.
3. From the project root, run the Python PDF builder with ReportLab and pypdf:
   `.local/subtitle-tools/bin/python submission/design/source/build-pdfs.py`.
4. For native macOS PDF page previews, compile `source/render-pdfs.swift`
   with `swiftc` and run it with the two PDF paths as arguments.

Editable Remotion compositions: `../video/remotion/src/design.tsx` and
`design-index.tsx`. Links/data and the PDF builder are in `source/`.
`render-info.json`, `verification.json`, and `../documents/document-info.json`
record output formats and quality checks. System fonts used: Arial family
and the app's monospace treatment. The PDF embeds the used font subsets.
