# pi-norain-extension

An extension collection for [Pi Coding Agent](https://github.com/earendil-works/pi-coding-agent).

## Features

- 🎨 **Startup banner and `/exit`**: displays a colorful startup banner with live environment details, and adds `/exit` for graceful session shutdown.
- 🔎 **Model identifier**: compares the model sent to the upstream provider with the model reported by the upstream response. It displays a concise warning above the editor when they differ.

## Model identifier

The model identifier records the final provider request's `model`, then prefers Pi's parsed `responseModel` and falls back to an upstream-model response header. It warns only when an upstream response model is actually observed and differs from the model sent upstream. It offers these commands:

- `/mi`: show the current match status.
- `/mi reload`: reload its configuration.
- `/mi config`: show the global configuration path.
- `/mi clear`: clear the active warning banner.

It reads optional global configuration from `~/.pi/agent/model-identifier.json`; it never creates or modifies this file. For example:

```json
{
  "enableWidgetNotice": true,
  "enableToastNotice": true,
  "enableStatusBar": false,
  "templates": {
    "widgetWarning": "⚠ Upstream response model mismatch [{sentModel}] -> [{actualModel}]",
    "toastModelWarning": "⚠ Upstream response model mismatch [{sentModel}] -> [{actualModel}]"
  }
}
```

## Installation

```bash
pi install git:github.com/StarWishsama/pi-norain-extension
```

## Tests

```powershell
bun test
```

## License

MIT
