import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

type RGB = readonly [number, number, number];

/**
 * Format string with 24-bit ANSI RGB color code.
 */
function rgb([r, g, b]: RGB, text: string, bold = false): string {
  return `${bold ? BOLD : ""}\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
}

/**
 * Interpolate between two RGB colors.
 */
function interpolateColor(from: RGB, to: RGB, factor: number): RGB {
  const t = Math.max(0, Math.min(1, factor));
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}

/**
 * Render text line with horizontal RGB color gradient.
 */
function gradientLine(text: string, from: RGB, to: RGB, bold = false): string {
  const chars = [...text];
  const span = Math.max(1, chars.length - 1);
  return chars
    .map((char, index) => {
      if (char === " ") return char;
      const color = interpolateColor(from, to, index / span);
      return rgb(color, char, bold);
    })
    .join("");
}

/**
 * Shorten path string if longer than maxLength.
 */
function formatPath(pathStr: string, maxLength = 28): string {
  if (!pathStr) return "";
  const normalized = pathStr.replace(/\\/g, "/");
  if (normalized.length <= maxLength) return normalized;
  const parts = normalized.split("/");
  if (parts.length <= 2) return "..." + normalized.slice(-maxLength + 3);
  return `${parts[0]}/.../${parts[parts.length - 1]}`;
}

/**
 * Custom ASCII Braille Banner Art
 */
const BANNER_ART = [
  "⠀⠀⠀⣀⣠⣶⣶⡟⠋⢀⣀⣶⠋⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
  "⠀⠐⠶⠿⣿⡿⢻⣵⣶⣤⠛⢣⣴⠟⠀⠀⠀⠀⠀⠀⠀⢰⡇",
  "⢸⣇⠀⠀⣄⠀⠀⠈⠙⢻⣦⠈⠛⠀⠀⠀⠀⠀⢀⠆⣠⣿⡇",
  "⢸⣿⣧⣾⣀⠀⠀⢸⣧⣀⣸⡿⠀⠀⠀⠀⠀⣠⣿⣴⣿⣿⡇",
  "⢸⣿⣿⣿⣿⣟⣲⣿⣿⣿⣿⣤⣶⣞⣁⣤⣾⣛⣉⣭⣭⣭⡅",
  "⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠉⠉⠉⠉⠋⠀",
  "⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⡀⢀⣿⠀⠀⠀⠀",
  "⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀",
  "⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠀⠀⠀⠀",
  "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⣰",
  "⣿⣿⣿⣿⣿⣿⣿⣛⣛⣛⣛⣿⣿⣿⣿⡏⠁⠀⠀⠀⣸⣿",
  "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠋⠀⠀⠀⣠⠚⣻⣿",
  "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⢋⠀⠀⠀⠀⠀⣼⡀⣼⣿⣿",
  "⣿⡿⠋⠉⣽⠛⠻⠿⠿⠟⢉⣴⠋⠀⠀⠀⢠⣶⣿⢀⣿⣿⣿",
] as const;

function getAvailableRows(tui: unknown): number {
  try {
    const terminal = (tui as { terminal?: { rows?: unknown } })?.terminal;
    const rows = terminal?.rows;
    return typeof rows === "number" && Number.isFinite(rows) ? Math.max(0, Math.floor(rows)) : 0;
  } catch {
    return 0;
  }
}

/**
 * Render the side-by-side (or responsive stacked) header banner with Pi system info.
 */
function renderHeader(
  width: number,
  availableRows: number,
  ctx?: ExtensionContext,
  pi?: ExtensionAPI
): string[] {
  if (width <= 0) return [];

  // Color Palette: Cyber Neon Pink/Purple -> Sky Blue Gradient
  const topColor: RGB = [255, 120, 190];
  const bottomColor: RGB = [100, 210, 255];
  const lavender: RGB = [199, 184, 245];
  const peach: RGB = [252, 201, 185];
  const cyan: RGB = [120, 220, 255];
  const green: RGB = [130, 235, 160];
  const yellow: RGB = [255, 210, 130];

  // Extract dynamic Pi Info safely
  const modelStr = ctx?.model
    ? `${ctx.model.provider} / ${ctx.model.id}`
    : "(Default Model)";
  
  let thinkingStr = "off";
  try {
    thinkingStr = (ctx?.thinkingLevel ?? pi?.getThinkingLevel?.() ?? "off").toString();
  } catch {
    thinkingStr = "off";
  }

  const modeStr = ctx?.mode ?? "tui";
  
  let sessionStr = "Ephemeral";
  try {
    const sId = ctx?.sessionManager?.getSessionId?.();
    if (sId) sessionStr = sId.length > 12 ? `${sId.slice(0, 10)}...` : sId;
  } catch {
    sessionStr = "Ephemeral";
  }

  const cwdStr = formatPath(ctx?.cwd ?? process.cwd());
  const sysStr = `${process.platform} ${process.arch} (Node ${process.version})`;

  let toolsCount = "Loaded";
  try {
    const activeTools = pi?.getActiveTools?.();
    if (Array.isArray(activeTools)) {
      toolsCount = `${activeTools.length} active`;
    }
  } catch {
    toolsCount = "Loaded";
  }

  // Build the 14 lines of Pi Information to display on the right
  const infoLines: string[] = [
    gradientLine("◈  PI CODING AGENT  ◈", lavender, peach, true),
    `${DIM}──────────────────────────────────────────${RESET}`,
    `${rgb(cyan, "Agent   :")} Pi Coding Agent (Pair Programmer)`,
    `${rgb(cyan, "Model   :")} ${rgb(yellow, modelStr)}`,
    `${rgb(cyan, "Thinking:")} ${rgb(green, thinkingStr)}`,
    `${rgb(cyan, "Mode    :")} ${modeStr}`,
    `${rgb(cyan, "Session :")} ${sessionStr}`,
    `${rgb(cyan, "CWD     :")} ${cwdStr}`,
    `${rgb(cyan, "System  :")} ${sysStr}`,
    `${rgb(cyan, "Tools   :")} ${toolsCount}`,
    `${rgb(cyan, "Status  :")} ${rgb(green, "● Active & Ready")}`,
    `${DIM}──────────────────────────────────────────${RESET}`,
    `${DIM}💡 Tip: Use /model, /exit or Ctrl+P${RESET}`,
    `${DIM}🚀 Pair programming mode initialized${RESET}`,
  ];

  const artWidth = 23;
  const separator = " │ ";
  const sideBySideMinWidth = 72;

  const lineCount = BANNER_ART.length;

  if (width >= sideBySideMinWidth) {
    // --- SIDE-BY-SIDE LAYOUT ---
    const combinedLines: string[] = [];

    for (let i = 0; i < lineCount; i++) {
      const rawArtChars = [...BANNER_ART[i]];
      while (rawArtChars.length < artWidth) rawArtChars.push(" ");
      const artStr = rawArtChars.join("");

      const rowColor = interpolateColor(topColor, bottomColor, i / (lineCount - 1 || 1));
      const coloredArt = gradientLine(artStr, rowColor, bottomColor);

      const infoPart = infoLines[i] ?? "";
      combinedLines.push(`${coloredArt}${DIM}${separator}${RESET}${infoPart}`);
    }

    const totalBoxWidth = artWidth + separator.length + 42;
    const padAmount = Math.max(0, Math.floor((width - totalBoxWidth) / 2));
    const pad = " ".repeat(padAmount);

    const visualHeight = lineCount + 2;
    const extraTopPadding = Math.max(0, Math.floor((availableRows - visualHeight) / 2) - 1);

    return [
      ...Array(extraTopPadding).fill(""),
      "",
      ...combinedLines.map((line) => `${pad}${line}`),
      "",
    ];
  } else {
    // --- STACKED NARROW LAYOUT ---
    const artPad = " ".repeat(Math.max(0, Math.floor((width - artWidth) / 2)));
    const artLines = BANNER_ART.map((line, i) => {
      const clipped = [...line].slice(0, width).join("");
      const rowColor = interpolateColor(topColor, bottomColor, i / (lineCount - 1 || 1));
      return `${artPad}${gradientLine(clipped, rowColor, bottomColor)}`;
    });

    const infoPadAmount = Math.max(0, Math.floor((width - 40) / 2));
    const infoPad = " ".repeat(infoPadAmount);
    const centeredInfo = infoLines.map((line) => `${infoPad}${line}`);

    const railWidth = Math.max(1, Math.min(width - 4, 40));
    const rail = "━".repeat(railWidth);
    const railPad = " ".repeat(Math.max(0, Math.floor((width - railWidth) / 2)));

    const visualHeight = lineCount + infoLines.length + 3;
    const extraTopPadding = Math.max(0, Math.floor((availableRows - visualHeight) / 2) - 1);

    return [
      ...Array(extraTopPadding).fill(""),
      "",
      ...artLines,
      "",
      `${railPad}${gradientLine(rail, topColor, bottomColor)}`,
      "",
      ...centeredInfo,
      "",
    ];
  }
}

/**
 * Pi Extension Entry Point
 */
export default function piNorainExtension(pi: ExtensionAPI): void {
  // Register /exit command (alias for /quit)
  pi.registerCommand("exit", {
    description: "Exit the session (alias for /quit)",
    handler: async (_args, ctx) => {
      ctx.shutdown();
    },
  });

  // Register Startup Banner
  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;
    ctx.ui.setHeader((tui) => ({
      render: (width) => renderHeader(width, getAvailableRows(tui), ctx, pi),
      invalidate() {},
    }));
  });

  pi.on("session_shutdown", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setHeader(undefined);
  });
}
