export const MODEL_NOTICE_ENTRY_TYPE = "model-identifier-notice";

export interface ModelMismatchNoticeData {
	timestamp: number;
	turnIndex?: number;
	selectedModel: string;
	selectedProvider?: string;
	requestedModel: string;
	sentModel: string;
	responseModel?: string;
	headerModel?: string;
	actualModel: string;
	reasons: string[];
}

export function observedResponseModel(responseModel?: string, headerModel?: string): string | undefined {
	const model = responseModel?.trim() || headerModel?.trim();
	return model || undefined;
}

export function normalizeModelName(raw?: string): string {
	if (!raw) return "";
	let name = raw.trim().toLowerCase();
	name = name.replace(/\[\d+[a-zA-Z]+\]/g, "").replace(/\(\d+[a-zA-Z]+\)/g, "").trim();
	while (name.includes("/")) name = name.slice(name.indexOf("/") + 1).trim();
	return name;
}

export function compareModels(
	sentModel: string,
	responseModel: string,
): { isMatch: boolean; details: string } {
	const sent = normalizeModelName(sentModel);
	const response = normalizeModelName(responseModel);
	if (!sent || !response) {
		return { isMatch: true, details: "模型名称为空或无法识别" };
	}
	if (sent === response) {
		return { isMatch: true, details: "发往上游的模型与上游响应模型一致" };
	}
	return {
		isMatch: false,
		details: `上游响应模型不一致：发往上游 [${sentModel}]，上游响应 [${responseModel}]`,
	};
}
