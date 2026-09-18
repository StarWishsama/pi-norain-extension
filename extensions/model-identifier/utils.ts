export const MODEL_NOTICE_ENTRY_TYPE = "model-identifier-notice";

export interface ModelMismatchNoticeData {
	timestamp: number;
	turnIndex?: number;
	selectedModel: string;
	selectedProvider?: string;
	requestedModel: string;
	responseModel?: string;
	headerModel?: string;
	actualModel: string;
	reasons: string[];
}

export function normalizeModelName(raw?: string): string {
	if (!raw) return "";
	let name = raw.trim().toLowerCase();
	name = name.replace(/\[\d+[a-zA-Z]+\]/g, "").replace(/\(\d+[a-zA-Z]+\)/g, "").trim();
	while (name.includes("/")) name = name.slice(name.indexOf("/") + 1).trim();
	return name;
}

export function compareModels(
	requestedModel: string,
	actualModel: string,
): { isMatch: boolean; details: string } {
	const requested = normalizeModelName(requestedModel);
	const actual = normalizeModelName(actualModel);
	if (!requested || !actual) {
		return { isMatch: true, details: "模型名称为空或无法识别" };
	}
	if (requested === actual) {
		return { isMatch: true, details: "请求模型与响应模型一致" };
	}
	return {
		isMatch: false,
		details: `响应模型与请求模型不一致：请求 [${requestedModel}]，实际响应 [${actualModel}]`,
	};
}
