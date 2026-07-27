# pi-norain-extension

A multi-feature extension package for [Pi Coding Agent](https://github.com/earendil-works/pi-coding-agent).

## Features

- 🎨 **Side-by-Side Startup Banner**: Renders customized ASCII Braille pixel art alongside a real-time Pi environment telemetry panel (Agent, Model, Thinking level, Mode, Session ID, CWD, System, Tools count, and Status).
- 🚪 **`/exit` Command**: Adds the `/exit` slash command to gracefully exit the interactive session (equivalent to `/quit`).
- 🌈 **Vibrant RGB Gradients**: 24-bit ANSI color gradients (Cyber Neon Pink → Sky Blue) across banner rows and title elements.
- 📐 **Terminal Responsive**: Automatically switches between side-by-side mode in wide viewports and a stacked layout in narrow viewports.
- 🛠️ **Image Converter Included**: Contains a Python conversion script (`scripts/convert.py`) to convert images into ASCII Braille pixel art.

## Commands

- `/exit` — Gracefully exits the current Pi session (calls `ctx.shutdown()`).

## Installation

Install directly as a Pi package from GitHub:

```bash
pi install git:github.com/StarWishsama/pi-norain-extension
```

## License

MIT
