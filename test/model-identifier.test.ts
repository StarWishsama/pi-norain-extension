import assert from "node:assert/strict";
import test from "node:test";
import { compareModels, normalizeModelName, observedResponseModel } from "../extensions/model-identifier/utils.ts";

test("模型名称标准化会移除代理前缀和上下文标记", () => {
	assert.equal(normalizeModelName("anthropic/claude-opus-5[1m]"), "claude-opus-5");
	assert.equal(normalizeModelName("gateway/openai/gpt-5.4"), "gpt-5.4");
});

test("模型对比判断发往上游的模型与上游响应是否一致", () => {
	assert.equal(compareModels("claude-opus-5[1m]", "anthropic/claude-opus-5").isMatch, true);
	assert.equal(compareModels("gpt-4o", "gpt-4o-2024-08-06").isMatch, false);
	assert.equal(compareModels("claude-sonnet-4.5", "claude-sonnet-4-5").isMatch, false);
	assert.equal(compareModels("claude-opus-5", "claude-sonnet-5").isMatch, false);
});

test("优先使用 Pi 解析的响应模型，响应头仅作回退", () => {
	assert.equal(observedResponseModel("gpt-5-sol", "gpt-5.5-sol"), "gpt-5-sol");
	assert.equal(observedResponseModel(undefined, "gpt-5.5-sol"), "gpt-5.5-sol");
	assert.equal(observedResponseModel("  ", "  "), undefined);
});
