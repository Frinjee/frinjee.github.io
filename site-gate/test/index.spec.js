import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src";

const LOGIN_PATH = "/__frinjee-gate/login";
const TEST_PASSWORD = "test-gate-password";
const TEST_SIGNING_SECRET = "test-signing-secret-at-least-32-chars-long";

function createTestEnv(overrides = {}) {
	return {
		...env,
		SITE_GATE_PASSWORD: TEST_PASSWORD,
		GATE_SIGNING_SECRET: TEST_SIGNING_SECRET,
		GITHUB_PAGES_HOST: "frinjee.github.io",
		...overrides,
	};
}

async function runWorker(request, testEnv = createTestEnv()) {
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, testEnv, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

function extractCookie(response) {
	const setCookie = response.headers.get("set-cookie") ?? "";
	const match = setCookie.match(/frinjee_gate=([^;]+)/);
	return match ? `frinjee_gate=${match[1]}` : "";
}

describe("site-gate worker", () => {
	let fetchSpy;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
			return new Response("upstream-body", {
				status: 200,
				headers: { "content-type": "text/html" },
			});
		});
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	it("returns 404 for ungated paths", async () => {
		const response = await runWorker(new Request("https://jenhammond.me/hoard/"));
		expect(response.status).toBe(404);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("returns login page for protected GET without cookie", async () => {
		const response = await runWorker(
			new Request("https://jenhammond.me/the-frinje-report/issues/issue-11.html"),
		);
		expect(response.status).toBe(401);
		const html = await response.text();
		expect(html).toContain("Password required");
		expect(html).toContain(LOGIN_PATH);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("rejects wrong password", async () => {
		const formData = new FormData();
		formData.set("password", "wrong");
		formData.set("return", "/the-frinje-report/");
		const response = await runWorker(
			new Request("https://jenhammond.me/__frinjee-gate/login", {
				method: "POST",
				body: formData,
			}),
		);
		expect(response.status).toBe(401);
		expect(response.headers.get("set-cookie")).toBeNull();
	});

	it("sets cookie and redirects on correct password", async () => {
		const formData = new FormData();
		formData.set("password", TEST_PASSWORD);
		formData.set("return", "/ff2026-chubba-league/");
		const response = await runWorker(
			new Request("https://jenhammond.me/__frinjee-gate/login", {
				method: "POST",
				body: formData,
			}),
		);
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("/ff2026-chubba-league/");
		expect(response.headers.get("set-cookie")).toContain("frinjee_gate=");
		expect(response.headers.get("set-cookie")).toContain("HttpOnly");
	});

	it("proxies to GitHub Pages when session cookie is valid", async () => {
		const loginResponse = await runWorker(
			new Request("https://jenhammond.me/__frinjee-gate/login", {
				method: "POST",
				body: (() => {
					const fd = new FormData();
					fd.set("password", TEST_PASSWORD);
					fd.set("return", "/the-frinje-report/");
					return fd;
				})(),
			}),
		);
		const cookie = extractCookie(loginResponse);
		const response = await runWorker(
			new Request("https://jenhammond.me/the-frinje-report/styles.css", {
				headers: { cookie },
			}),
		);
		expect(response.status).toBe(200);
		expect(fetchSpy).toHaveBeenCalled();
		const upstreamRequest = fetchSpy.mock.calls[0][0];
		const upstreamUrl =
			upstreamRequest instanceof Request ? upstreamRequest.url : String(upstreamRequest);
		expect(upstreamUrl).toContain("https://frinjee.github.io/the-frinje-report/styles.css");
	});

	it("blocks protected POST without session", async () => {
		const response = await runWorker(
			new Request("https://jenhammond.me/ff2026-chubba-league/", { method: "POST", body: "x" }),
		);
		expect(response.status).toBe(401);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("returns 503 when secrets are missing", async () => {
		const response = await runWorker(
			new Request("https://jenhammond.me/__frinjee-gate/login", {
				method: "POST",
				body: (() => {
					const fd = new FormData();
					fd.set("password", "x");
					return fd;
				})(),
			}),
			createTestEnv({ SITE_GATE_PASSWORD: undefined, GATE_SIGNING_SECRET: undefined }),
		);
		expect(response.status).toBe(503);
	});
});
