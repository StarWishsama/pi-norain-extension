import assert from "node:assert/strict";
import test from "node:test";
import { compareModels, normalizeModelName } from "../extensions/model-identifier/utils.ts";

test("模型名称标准化会移除代理前缀和上下文标记", () => {
	assert.equal(normalizeModelName("anthropic/claude-opus-5[1m]"), "claude-opus-5");
	assert.equal(normalizeModelName("gateway/openai/gpt-5.4"), "gpt-5.4");
});

test("模型对比仅判断请求与响应模型是否一致", () => {
	assert.equal(compareModels("claude-opus-5[1m]", "anthropic/claude-opus-5").isMatch, true);
	assert.equal(compareModels("gpt-4o", "gpt-4o-2024-08-06").isMatch, false);
	assert.equal(compareModels("claude-sonnet-4.5", "claude-sonnet-4-5").isMatch, false);
	assert.equal(compareModels("claude-opus-5", "claude-sonnet-5").isMatch, false);
});
