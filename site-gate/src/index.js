const COOKIE_NAME = "frinjee_gate";
const LOGIN_PATH = "/__frinjee-gate/login";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

const PROTECTED_PREFIXES = ["/the-frinje-report", "/ff2026-chubba-league"];

const DEFAULT_GITHUB_PAGES_HOST = "frinjee.github.io";

function timingSafeEqual(a, b) {
	if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

function isProtectedPath(pathname) {
	return PROTECTED_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

function isSafeReturnPath(pathname) {
	if (!pathname || !pathname.startsWith("/")) {
		return false;
	}
	if (pathname.startsWith("//") || pathname.includes("\\")) {
		return false;
	}
	return isProtectedPath(pathname);
}

function bytesToBase64Url(bytes) {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/");
	const padLen = (4 - (padded.length % 4)) % 4;
	const base64 = padded + "=".repeat(padLen);
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function importHmacKey(secret) {
	const encoder = new TextEncoder();
	return crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

async function signSessionPayload(payload, secret) {
	const key = await importHmacKey(secret);
	const encoder = new TextEncoder();
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
	return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySessionPayload(payload, signature, secret) {
	const key = await importHmacKey(secret);
	const encoder = new TextEncoder();
	try {
		const sigBytes = base64UrlToBytes(signature);
		return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
	} catch {
		return false;
	}
}

async function createSessionCookie(env) {
	const secret = env.GATE_SIGNING_SECRET;
	if (!secret) {
		throw new Error("missing-signing-secret");
	}
	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
	const payload = String(expiresAt);
	const signature = await signSessionPayload(payload, secret);
	const value = `${payload}.${signature}`;
	return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}`;
}

async function hasValidSession(request, env) {
	const secret = env.GATE_SIGNING_SECRET;
	if (!secret) {
		return false;
	}
	const cookieHeader = request.headers.get("cookie") ?? "";
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
	if (!match) {
		return false;
	}
	const raw = match[1];
	const dot = raw.lastIndexOf(".");
	if (dot <= 0) {
		return false;
	}
	const payload = raw.slice(0, dot);
	const signature = raw.slice(dot + 1);
	const expiresAt = Number.parseInt(payload, 10);
	if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
		return false;
	}
	return verifySessionPayload(payload, signature, secret);
}

function loginPageHtml(returnPath) {
	const safeReturn = isSafeReturnPath(returnPath) ? returnPath : "/the-frinje-report/";
	const escapedReturn = safeReturn.replace(/"/g, "&quot;");
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Password required</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; max-width: 24rem; }
    label { display: block; margin-bottom: 0.5rem; }
    input[type=password] { width: 100%; padding: 0.5rem; box-sizing: border-box; }
    button { margin-top: 1rem; padding: 0.5rem 1rem; }
    p.err { color: #a00; }
  </style>
</head>
<body>
  <h1>Password required</h1>
  <form method="post" action="${LOGIN_PATH}">
    <input type="hidden" name="return" value="${escapedReturn}">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Continue</button>
  </form>
</body>
</html>`;
}

function loginErrorHtml(returnPath) {
	const page = loginPageHtml(returnPath);
	return page.replace(
		"<h1>Password required</h1>",
		"<h1>Password required</h1><p class=\"err\">Incorrect password. Try again.</p>",
	);
}

async function parseLoginBody(request) {
	const contentType = request.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		try {
			const body = await request.json();
			return {
				password: body?.password,
				returnPath: body?.return,
			};
		} catch {
			return null;
		}
	}
	const formData = await request.formData();
	return {
		password: formData.get("password"),
		returnPath: formData.get("return"),
	};
}

async function handleLogin(request, env) {
	const body = await parseLoginBody(request);
	if (!body) {
		return new Response("Bad request", { status: 400 });
	}
	const expected = env.SITE_GATE_PASSWORD;
	if (!expected) {
		return new Response("Gate not configured", { status: 503 });
	}
	const password = String(body.password ?? "");
	if (!timingSafeEqual(password, expected)) {
		const returnPath = String(body.returnPath ?? "/the-frinje-report/");
		return new Response(loginErrorHtml(returnPath), {
			status: 401,
			headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
		});
	}
	const returnPath = isSafeReturnPath(String(body.returnPath ?? ""))
		? String(body.returnPath)
		: "/the-frinje-report/";
	let setCookie;
	try {
		setCookie = await createSessionCookie(env);
	} catch {
		return new Response("Gate not configured", { status: 503 });
	}
	return new Response(null, {
		status: 303,
		headers: {
			location: returnPath,
			"set-cookie": setCookie,
			"cache-control": "no-store",
		},
	});
}

function getGithubPagesHost(env) {
	const host = env.GITHUB_PAGES_HOST ?? DEFAULT_GITHUB_PAGES_HOST;
	return String(host).trim() || DEFAULT_GITHUB_PAGES_HOST;
}

async function fetchFromGithubPages(request, env) {
	const upstreamUrl = new URL(request.url);
	upstreamUrl.hostname = getGithubPagesHost(env);
	upstreamUrl.protocol = "https:";

	const headers = new Headers(request.headers);
	headers.set("Host", getGithubPagesHost(env));
	headers.delete("cf-connecting-ip");
	headers.delete("cf-ray");
	headers.delete("cf-visitor");

	const upstreamRequest = new Request(upstreamUrl.toString(), {
		method: request.method,
		headers,
		body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
		redirect: "manual",
	});

	return fetch(upstreamRequest);
}

async function handleProtected(request, env) {
	const url = new URL(request.url);
	if (url.pathname === LOGIN_PATH && request.method === "POST") {
		return handleLogin(request, env);
	}
	if (await hasValidSession(request, env)) {
		return fetchFromGithubPages(request, env);
	}
	if (request.method !== "GET" && request.method !== "HEAD") {
		return new Response("Unauthorized", { status: 401 });
	}
	return new Response(loginPageHtml(url.pathname), {
		status: 401,
		headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
	});
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === LOGIN_PATH && request.method === "POST") {
			return handleLogin(request, env);
		}
		if (isProtectedPath(url.pathname)) {
			return handleProtected(request, env);
		}
		return new Response("Not found", { status: 404 });
	},
};
