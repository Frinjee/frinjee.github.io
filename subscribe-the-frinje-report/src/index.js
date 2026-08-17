const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_ALLOWED_HOSTNAMES =
	"jenhammond.me,www.jenhammond.me,frinjee.github.io,localhost,127.0.0.1";
const DEFAULT_ALLOWED_ORIGINS =
	"https://jenhammond.me,https://www.jenhammond.me,https://frinjee.github.io,http://localhost:8080,http://127.0.0.1:8080";

function getAllowedOrigin(request, env) {
	const origin = request.headers.get("origin") ?? "";
	const allowed = (env.CORS_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS)
		.split(",")
		.map((value) => value.trim());
	return allowed.includes(origin) ? origin : null;
}

function jsonResponse(payload, status = 200, origin = null) {
	const headers = {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		vary: "Origin",
	};
	if (origin) {
		headers["access-control-allow-origin"] = origin;
	}
	return new Response(JSON.stringify(payload), { status, headers });
}

function normalizeEmail(rawEmail) {
	if (typeof rawEmail !== "string") {
		return "";
	}
	return rawEmail.trim().toLowerCase();
}

function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(request) {
	const cfIp = request.headers.get("cf-connecting-ip");
	if (cfIp) return cfIp;
	const forwarded = request.headers.get("x-forwarded-for");
	if (!forwarded) return "";
	return forwarded.split(",")[0]?.trim() ?? "";
}

function getAllowedHostnames(env) {
	const configuredHostnames = env.TURNSTILE_HOSTNAMES ?? DEFAULT_ALLOWED_HOSTNAMES;
	return new Set(
		configuredHostnames
			.split(",")
			.map((hostname) => hostname.trim().toLowerCase())
			.filter(Boolean),
	);
}

async function verifyTurnstileToken({ token, clientIp, env, expectedAction, expectedHostnames }) {
	if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
		return { ok: false, reason: "invalid-token" };
	}

	if (!env.TURNSTILE_SECRET || typeof env.TURNSTILE_SECRET !== "string") {
		return { ok: false, reason: "missing-secret" };
	}

	if (expectedHostnames.size === 0) {
		return { ok: false, reason: "missing-hostnames" };
	}

	let verification;
	try {
		const response = await fetch(TURNSTILE_VERIFY_URL, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				secret: env.TURNSTILE_SECRET,
				response: token,
				remoteip: clientIp,
			}),
		});
		if (!response.ok) {
			return { ok: false, reason: `siteverify-${response.status}` };
		}
		verification = await response.json();
	} catch {
		return { ok: false, reason: "siteverify-failed" };
	}

	const hostname = String(verification.hostname || "").toLowerCase();
	if (!verification.success || verification.action !== expectedAction || !expectedHostnames.has(hostname)) {
		return { ok: false, reason: "siteverify-rejected", details: verification };
	}

	return { ok: true, details: verification };
}

async function parseSubscribeBody(request) {
	const contentType = request.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		let body;
		try {
			body = await request.json();
		} catch {
			return null;
		}
		if (!body || typeof body !== "object") {
			return null;
		}
		return {
			email: body.email,
			honeypot: body.company,
			token: body["cf-turnstile-response"] ?? body.turnstileToken,
		};
	}
	const formData = await request.formData();
	return {
		email: formData.get("email"),
		honeypot: formData.get("company"),
		token: formData.get("cf-turnstile-response"),
	};
}

async function handleSubscribe(request, env, origin) {
	if (!env.subscribe_the_frinje_report) {
		return jsonResponse({ ok: false, error: "database-binding-missing" }, 500, origin);
	}

	const body = await parseSubscribeBody(request);
	if (!body) {
		return jsonResponse({ ok: false, error: "invalid-body" }, 400, origin);
	}

	const honeypot = String(body.honeypot ?? "").trim();
	if (honeypot) {
		return jsonResponse({ ok: true }, 200, origin);
	}

	const email = normalizeEmail(body.email);
	if (!isValidEmail(email)) {
		return jsonResponse({ ok: false, error: "invalid-email" }, 400, origin);
	}

	const expectedAction = env.TURNSTILE_ACTION ?? "subscribe";
	const verification = await verifyTurnstileToken({
		token: body.token,
		clientIp: getClientIp(request),
		env,
		expectedAction,
		expectedHostnames: getAllowedHostnames(env),
	});
	if (!verification.ok) {
		return jsonResponse({ ok: false, error: "forbidden", reason: verification.reason }, 403, origin);
	}

	const referer = request.headers.get("referer");
	let sourcePath = new URL(request.url).pathname;
	if (referer) {
		try {
			sourcePath = new URL(referer).pathname || sourcePath;
		} catch {
			// Keep the request path fallback when referer is malformed.
		}
	}
	const result = await env.subscribe_the_frinje_report
		.prepare(
			`INSERT OR IGNORE INTO subscriptions (email, source_path, turnstile_action, turnstile_hostname)
			 VALUES (?, ?, ?, ?)`,
		)
		.bind(
			email,
			sourcePath,
			expectedAction,
			String(verification.details?.hostname ?? ""),
		)
		.run();

	const isDuplicate = result.meta?.changes === 0;
	const payload = isDuplicate ? { ok: true, duplicate: true } : { ok: true };
	try {
		const countRow = await env.subscribe_the_frinje_report
			.prepare("SELECT COUNT(*) AS count FROM subscriptions")
			.first();
		const count = Number(countRow?.count ?? 0);
		if (Number.isFinite(count)) {
			payload.count = count;
		}
	} catch {
		// Subscribe succeeded; omit count rather than failing the request.
	}
	return jsonResponse(payload, 200, origin);
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const origin = getAllowedOrigin(request, env);
		if (request.method === "OPTIONS" && url.pathname === "/subscribe") {
			if (!origin) {
				return new Response(null, { status: 403 });
			}
			return new Response(null, {
				status: 204,
				headers: {
					"access-control-allow-origin": origin,
					"access-control-allow-methods": "POST, OPTIONS",
					"access-control-allow-headers": "content-type",
					"access-control-max-age": "86400",
					vary: "Origin",
				},
			});
		}
		if (request.method === "POST" && url.pathname === "/subscribe") {
			return handleSubscribe(request, env, origin);
		}
		if (url.pathname === "/health") {
			return jsonResponse({ ok: true });
		}
		return new Response("Not found", { status: 404 });
	},
};
