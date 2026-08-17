import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src";

const SITE_ORIGIN = "https://frinjee.github.io";

function createD1Mock({ countError = false } = {}) {
	const records = new Map();
	return {
		records,
		prepare(sql) {
			if (/SELECT COUNT\(\*\)/i.test(sql)) {
				return {
					async first() {
						if (countError) {
							throw new Error("count-query-failed");
						}
						return { count: records.size };
					},
				};
			}
			return {
				bind(email, sourcePath, turnstileAction, turnstileHostname) {
					return {
						async run() {
							const isDuplicate = records.has(email);
							if (!isDuplicate) {
								records.set(email, {
									email,
									sourcePath,
									turnstileAction,
									turnstileHostname,
								});
							}
							return { success: true, meta: { changes: isDuplicate ? 0 : 1 } };
						},
					};
				},
			};
		},
	};
}

function createTestEnv(db) {
	return {
		...env,
		TURNSTILE_SECRET: "test-secret",
		TURNSTILE_ACTION: "subscribe",
		TURNSTILE_HOSTNAMES: "frinjee.github.io",
		SUBSCRIBER_BASE_COUNT: "43",
		subscribe_the_frinje_report: db,
	};
}

function createCountRequest(origin = SITE_ORIGIN) {
	return new Request("http://worker.example/count", {
		method: "GET",
		headers: { origin },
	});
}

function createSubscribeRequest(email, token = "token-abc", origin = SITE_ORIGIN) {
	const formData = new FormData();
	formData.set("email", email);
	formData.set("company", "");
	formData.set("cf-turnstile-response", token);
	return new Request("http://worker.example/subscribe", {
		method: "POST",
		headers: { origin },
		body: formData,
	});
}

describe("subscribe worker", () => {
	let fetchSpy;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
			async () =>
				new Response(
					JSON.stringify({
						success: true,
						action: "subscribe",
						hostname: "frinjee.github.io",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				),
		);
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	it("accepts a valid subscription and stores it in D1", async () => {
		const db = createD1Mock();
		const request = createSubscribeRequest("reader@example.com");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, createTestEnv(db), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true, count: 44 });
		expect(response.headers.get("access-control-allow-origin")).toBe(SITE_ORIGIN);
		expect(db.records.get("reader@example.com")).toEqual({
			email: "reader@example.com",
			sourcePath: "/subscribe",
			turnstileAction: "subscribe",
			turnstileHostname: "frinjee.github.io",
		});
	});

	it("accepts a valid JSON body subscription", async () => {
		const db = createD1Mock();
		const request = new Request("http://worker.example/subscribe", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: SITE_ORIGIN,
			},
			body: JSON.stringify({
				email: "json-reader@example.com",
				company: "",
				"cf-turnstile-response": "token-json",
			}),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, createTestEnv(db), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true, count: 44 });
		expect(db.records.has("json-reader@example.com")).toBe(true);
	});

	it("rejects malformed JSON bodies", async () => {
		const request = new Request("http://worker.example/subscribe", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: SITE_ORIGIN,
			},
			body: "{not-json",
		});
		const response = await worker.fetch(request, createTestEnv(createD1Mock()));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({ ok: false, error: "invalid-body" });
	});

	it("rejects a subscription when Turnstile verification fails", async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					success: false,
					action: "subscribe",
					hostname: "frinjee.github.io",
					"error-codes": ["invalid-input-response"],
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);
		const request = createSubscribeRequest("reader@example.com", "bad-token");
		const response = await worker.fetch(request, createTestEnv(createD1Mock()));
		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toMatchObject({
			ok: false,
			error: "forbidden",
		});
	});

	it("flags duplicate email submissions without overwriting the row", async () => {
		const db = createD1Mock();
		const testEnv = createTestEnv(db);
		const first = await worker.fetch(createSubscribeRequest("repeat@example.com", "token-1"), testEnv);
		await expect(first.json()).resolves.toEqual({ ok: true, count: 44 });
		const second = await worker.fetch(createSubscribeRequest("repeat@example.com", "token-2"), testEnv);
		expect(second.status).toBe(200);
		await expect(second.json()).resolves.toEqual({ ok: true, duplicate: true, count: 44 });
		expect(db.records.size).toBe(1);
		expect(db.records.get("repeat@example.com")?.email).toBe("repeat@example.com");
	});

	it("returns an incremented count after a second distinct email", async () => {
		const db = createD1Mock();
		const testEnv = createTestEnv(db);
		const first = await worker.fetch(createSubscribeRequest("one@example.com", "token-1"), testEnv);
		await expect(first.json()).resolves.toEqual({ ok: true, count: 44 });
		const second = await worker.fetch(createSubscribeRequest("two@example.com", "token-2"), testEnv);
		expect(second.status).toBe(200);
		await expect(second.json()).resolves.toEqual({ ok: true, count: 45 });
		expect(db.records.size).toBe(2);
	});

	it("still accepts a subscription when the count query fails", async () => {
		const db = createD1Mock({ countError: true });
		const response = await worker.fetch(createSubscribeRequest("reader@example.com"), createTestEnv(db));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true });
		expect(db.records.has("reader@example.com")).toBe(true);
	});

	it("silently accepts honeypot submissions without writing to D1", async () => {
		const db = createD1Mock();
		const formData = new FormData();
		formData.set("email", "bot@example.com");
		formData.set("company", "spammy");
		formData.set("cf-turnstile-response", "token-bot");
		const request = new Request("http://worker.example/subscribe", {
			method: "POST",
			headers: { origin: SITE_ORIGIN },
			body: formData,
		});
		const response = await worker.fetch(request, createTestEnv(db));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true });
		expect(db.records.size).toBe(0);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("answers CORS preflight for the site origin and rejects others", async () => {
		const allowed = await worker.fetch(
			new Request("http://worker.example/subscribe", {
				method: "OPTIONS",
				headers: { origin: SITE_ORIGIN },
			}),
			env,
		);
		expect(allowed.status).toBe(204);
		expect(allowed.headers.get("access-control-allow-origin")).toBe(SITE_ORIGIN);
		expect(allowed.headers.get("access-control-allow-methods")).toContain("GET");
		expect(allowed.headers.get("access-control-allow-methods")).toContain("POST");

		const disallowed = await worker.fetch(
			new Request("http://worker.example/subscribe", {
				method: "OPTIONS",
				headers: { origin: "https://evil.example" },
			}),
			env,
		);
		expect(disallowed.status).toBe(403);
		expect(disallowed.headers.get("access-control-allow-origin")).toBeNull();
	});

	it("omits CORS headers on POST responses for disallowed origins", async () => {
		const response = await worker.fetch(
			createSubscribeRequest("reader@example.com", "token-abc", "https://evil.example"),
			createTestEnv(createD1Mock()),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("access-control-allow-origin")).toBeNull();
	});

	it("returns display count from GET /count", async () => {
		const db = createD1Mock();
		const testEnv = createTestEnv(db);
		const empty = await worker.fetch(createCountRequest(), testEnv);
		expect(empty.status).toBe(200);
		await expect(empty.json()).resolves.toEqual({ ok: true, count: 43 });
		expect(empty.headers.get("access-control-allow-origin")).toBe(SITE_ORIGIN);

		await worker.fetch(createSubscribeRequest("reader@example.com"), testEnv);
		const afterInsert = await worker.fetch(createCountRequest(), testEnv);
		expect(afterInsert.status).toBe(200);
		await expect(afterInsert.json()).resolves.toEqual({ ok: true, count: 44 });
	});

	it("answers CORS preflight for GET /count", async () => {
		const allowed = await worker.fetch(
			new Request("http://worker.example/count", {
				method: "OPTIONS",
				headers: { origin: SITE_ORIGIN },
			}),
			env,
		);
		expect(allowed.status).toBe(204);
		expect(allowed.headers.get("access-control-allow-origin")).toBe(SITE_ORIGIN);
		expect(allowed.headers.get("access-control-allow-methods")).toContain("GET");

		const disallowed = await worker.fetch(
			new Request("http://worker.example/count", {
				method: "OPTIONS",
				headers: { origin: "https://evil.example" },
			}),
			env,
		);
		expect(disallowed.status).toBe(403);
	});

	it("omits CORS headers on GET /count for disallowed origins", async () => {
		const response = await worker.fetch(
			createCountRequest("https://evil.example"),
			createTestEnv(createD1Mock()),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("access-control-allow-origin")).toBeNull();
	});

	it("returns 404 for unknown path and method", async () => {
		const getSubscribe = await worker.fetch(new Request("http://worker.example/subscribe", { method: "GET" }), env);
		expect(getSubscribe.status).toBe(404);
		const postWrongPath = await worker.fetch(
			new Request("http://worker.example/other", { method: "POST" }),
			env,
		);
		expect(postWrongPath.status).toBe(404);
	});
});
