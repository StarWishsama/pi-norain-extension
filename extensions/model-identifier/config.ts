/**
 * 模型识别配置管理与模板渲染。
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let configDir = ".pi";
try {
	const pi = require("@earendil-works/pi-coding-agent") as { CONFIG_DIR_NAME?: string };
	configDir = pi.CONFIG_DIR_NAME || configDir;
} catch {
	// 单元测试和独立运行时没有安装 Pi peer dependency，使用默认目录。
}

const CONFIG_DIR = configDir;

export interface ModelIdentifierTemplates {
	widgetWarning: string;
	toastModelWarning: string;
	statusNormal: string;
	statusBusy: string;
	statusWarning: string;
	reasonModelMismatch: string;
}

export interface ModelIdentifierConfig {
	enableWidgetNotice: boolean;
	enableToastNotice: boolean;
	enableStatusBar: boolean;
	templates: ModelIdentifierTemplates;
}

export const DEFAULT_TEMPLATES: ModelIdentifierTemplates = {
	widgetWarning: "⚠ 响应模型不一致 [{requestedModel}] -> [{actualModel}]",
	toastModelWarning: "⚠ 响应模型不一致 [{requestedModel}] -> [{actualModel}]",
	statusNormal: "🎯 请求模型: {requestedModel} {provider}",
	statusBusy: "🚀 正在请求: {requestedModel}",
	statusWarning: "⚠️ 响应模型: {actualModel} (请求: {requestedModel})",
	reasonModelMismatch: "响应模型与请求模型不一致：请求 [{requestedModel}]，实际响应 [{actualModel}]",
};

export const DEFAULT_CONFIG: ModelIdentifierConfig = {
	enableWidgetNotice: true,
	enableToastNotice: true,
	enableStatusBar: false,
	templates: DEFAULT_TEMPLATES,
};

export function formatTemplate(
	template: string,
	vars: Record<string, string | number | undefined | null>,
): string {
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		const value = vars[key];
		return value !== undefined && value !== null ? String(value) : "";
	});
}

export function loadConfig(cwd: string): ModelIdentifierConfig {
	const configPath = join(cwd, CONFIG_DIR, "model-identifier.json");

	try {
		if (existsSync(configPath)) {
			const parsed = JSON.parse(readFileSync(configPath, "utf8")) as Partial<ModelIdentifierConfig>;
			return {
				...DEFAULT_CONFIG,
				...parsed,
				templates: {
					...DEFAULT_TEMPLATES,
					...(parsed.templates || {}),
				},
			};
		}
	} catch (error) {
		console.warn("[model-identifier] 读取配置文件失败，使用默认配置:", error);
	}

	return { ...DEFAULT_CONFIG };
}

export function ensureConfigFile(cwd: string): string {
	const configPath = join(cwd, CONFIG_DIR, "model-identifier.json");
	if (!existsSync(configPath)) {
		try {
			writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
		} catch (error) {
			console.warn("[model-identifier] 创建默认配置文件失败:", error);
		}
	}
	return configPath;
}
