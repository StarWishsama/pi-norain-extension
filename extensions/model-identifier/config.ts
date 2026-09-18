import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

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
	widgetWarning: "⚠ 检测到模型替换 [{selectedModel}] -> [{actualModel}]",
	toastModelWarning: "⚠ 检测到模型替换 [{selectedModel}] -> [{actualModel}]",
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

export function getConfigPath(): string {
	return join(getAgentDir(), "model-identifier.json");
}

export function loadConfig(): ModelIdentifierConfig {
	try {
		const configPath = getConfigPath();
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
		console.warn("[model-identifier] 读取全局配置文件失败，使用默认配置:", error);
	}
	return { ...DEFAULT_CONFIG };
}
