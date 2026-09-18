import type { AssistantMessage, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { DEFAULT_CONFIG, ensureConfigFile, formatTemplate, loadConfig, type ModelIdentifierConfig } from "./config.ts";
import { compareModels, type ModelMismatchNoticeData } from "./utils.ts";

export { DEFAULT_CONFIG, formatTemplate, loadConfig, type ModelIdentifierConfig } from "./config.ts";
export { MODEL_NOTICE_ENTRY_TYPE, compareModels, normalizeModelName, type ModelMismatchNoticeData } from "./utils.ts";

const WIDGET_ID = "model-identifier-warning";
const STATUS_ID = "model-identifier";

export default function modelIdentifierExtension(pi: ExtensionAPI): void {
	let config: ModelIdentifierConfig = DEFAULT_CONFIG;
	let requestedModel: string | undefined;
	let responseHeaderModel: string | undefined;
	let turnMismatches: ModelMismatchNoticeData[] = [];
	let lastNotice: ModelMismatchNoticeData | undefined;

	function templateVars(ctx: ExtensionContext, notice?: ModelMismatchNoticeData): Record<string, string | number | undefined> {
		const selectedModel = ctx.model?.id || "未选择模型";
		return {
			selectedModel: notice?.selectedModel || selectedModel,
			requestedModel: notice?.requestedModel || requestedModel || selectedModel,
			actualModel: notice?.actualModel || requestedModel || selectedModel,
			provider: notice?.selectedProvider || ctx.model?.provider || "",
		};
	}

	function updateStatus(ctx: ExtensionContext, statusText?: string): void {
		if (!ctx.hasUI) return;
		if (!config.enableStatusBar) {
			ctx.ui.setStatus(STATUS_ID, undefined);
			return;
		}
		if (statusText) {
			ctx.ui.setStatus(STATUS_ID, statusText);
			return;
		}
		const template = lastNotice ? config.templates.statusWarning : config.templates.statusNormal;
		ctx.ui.setStatus(STATUS_ID, formatTemplate(template, templateVars(ctx, lastNotice)));
	}

	pi.on("session_start", (_event, ctx) => {
		config = loadConfig(ctx.cwd);
		ensureConfigFile(ctx.cwd);
		requestedModel = ctx.model?.id;
		responseHeaderModel = undefined;
		turnMismatches = [];
		lastNotice = undefined;
		updateStatus(ctx);
	});

	pi.on("model_select", (event, ctx) => {
		requestedModel = event.model.id;
		updateStatus(ctx);
	});

	pi.on("before_agent_start", (_event, ctx) => {
		responseHeaderModel = undefined;
		turnMismatches = [];
		if (ctx.hasUI) ctx.ui.setWidget(WIDGET_ID, undefined);
		updateStatus(ctx);
	});

	pi.on("turn_start", (_event, ctx) => {
		responseHeaderModel = undefined;
		requestedModel = ctx.model?.id;
		updateStatus(ctx, formatTemplate(config.templates.statusBusy, templateVars(ctx)));
	});

	pi.on("before_provider_request", (event, ctx) => {
		const payload = event.payload as Record<string, unknown> | undefined;
		requestedModel = typeof payload?.model === "string" && payload.model ? payload.model : ctx.model?.id;
		updateStatus(ctx, formatTemplate(config.templates.statusBusy, templateVars(ctx)));
	});

	pi.on("after_provider_response", (event) => {
		const headers = event.headers || {};
		responseHeaderModel = headers["x-model-name"] || headers["openai-model"] || headers["x-openrouter-model"] || headers["x-model"] || headers["x-upstream-model"] || headers["cf-aig-model"] || headers["x-served-model"] || headers["x-actual-model"] || headers["x-deepseek-model"] || headers["x-zai-model"] || headers["x-zhipu-model"] || headers["x-grok-model"] || headers["x-anthropic-model"] || headers.model || headers["x-served-by-model"];
	});

	pi.on("turn_end", (event, ctx) => {
		if (event.message.role !== "assistant") return;
		const message = event.message as AssistantMessage;
		const selectedModel = ctx.model?.id || requestedModel || "unknown";
		const requested = requestedModel || selectedModel;
		const actualModel = message.responseModel || responseHeaderModel || message.model || requested;
		const modelMismatch = !compareModels(requested, actualModel).isMatch;
		if (!modelMismatch) return;

		const vars = { selectedModel, requestedModel: requested, actualModel, provider: ctx.model?.provider };
		const reasons = [formatTemplate(config.templates.reasonModelMismatch, vars)];
		lastNotice = {
			timestamp: Date.now(), turnIndex: event.turnIndex, selectedModel, selectedProvider: ctx.model?.provider,
			requestedModel: requested, responseModel: message.responseModel, headerModel: responseHeaderModel,
			actualModel, reasons,
		};
		turnMismatches.push(lastNotice);
	});

	pi.on("agent_end", (_event, ctx) => {
		const notice = turnMismatches.at(-1);
		if (!notice) {
			if (ctx.hasUI) ctx.ui.setWidget(WIDGET_ID, undefined);
			updateStatus(ctx);
			return;
		}
		const vars = templateVars(ctx, notice);
		const warning = formatTemplate(config.templates.widgetWarning, vars);
		const toast = formatTemplate(config.templates.toastModelWarning, vars);
		if (ctx.hasUI && config.enableWidgetNotice) ctx.ui.setWidget(WIDGET_ID, [ctx.ui.theme.bold(ctx.ui.theme.fg("warning", warning))]);
		if (ctx.hasUI && config.enableToastNotice) ctx.ui.notify(toast, "warning");
		updateStatus(ctx);
	});

	const handleCommand = async (args: string, ctx: ExtensionContext) => {
		const command = args.trim().toLowerCase();
		if (command === "reload") {
			config = loadConfig(ctx.cwd);
			updateStatus(ctx);
			if (ctx.hasUI) ctx.ui.notify("已重新加载 model-identifier 配置文件", "info");
			return;
		}
		if (command === "config") {
			if (ctx.hasUI) ctx.ui.notify(`配置文件: ${ensureConfigFile(ctx.cwd)}`, "info");
			return;
		}
		if (command === "clear") {
			lastNotice = undefined;
			if (ctx.hasUI) ctx.ui.setWidget(WIDGET_ID, undefined);
			updateStatus(ctx);
			return;
		}
		const text = lastNotice
			? `【模型检测状态 - 发现异常】\n• 请求模型: ${lastNotice.requestedModel}\n• 实际响应: ${lastNotice.actualModel}\n• 差异原因: ${lastNotice.reasons.join("; ")}`
			: `【模型检测状态 - 正常】\n• 请求模型: ${requestedModel || ctx.model?.id || "未选择"}`;
		if (ctx.hasUI) ctx.ui.notify(text, lastNotice ? "warning" : "info");
	};

	pi.registerCommand("mi", { description: "模型识别与诊断 (/mi [reload|config|clear])", handler: handleCommand });
	pi.registerCommand("model-identifier", { description: "模型识别与诊断 (/mi 别名)", handler: handleCommand });
}
