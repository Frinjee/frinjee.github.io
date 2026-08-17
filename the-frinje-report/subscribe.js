const WORKER_SUBSCRIBE_URL = "https://subscribe-the-frinje-report.jenifer-hammond.workers.dev/subscribe";

const STATUS_STATE_CLASSES = [
	"fr-subscribe-status--busy",
	"fr-subscribe-status--ok",
	"fr-subscribe-status--error",
];

function setStatus(status, message, stateClass) {
	status.textContent = message;
	status.classList.remove(...STATUS_STATE_CLASSES);
	if (stateClass) {
		status.classList.add(stateClass);
	}
	if (stateClass === "fr-subscribe-status--busy") {
		status.setAttribute("aria-busy", "true");
	} else {
		status.removeAttribute("aria-busy");
	}
}

function setBadgeCount(count) {
	if (!Number.isFinite(count) || count < 0) return;
	const display = String(Math.trunc(count));
	document.querySelectorAll(".fr-subscriber-badge").forEach((badge) => {
		const countEl = badge.querySelector(".fr-subscriber-badge-count");
		if (countEl) {
			countEl.textContent = display;
		}
		badge.setAttribute("aria-label", `${display} subscribers`);
	});
}

document.querySelectorAll(".fr-subscribe-form").forEach((form) => {
	const wrap = form.closest(".fr-subscribe-form-wrap");
	const status = wrap?.querySelector(".fr-subscribe-status");
	const button = form.querySelector(".fr-subscribe-button");
	if (!status || !button) return;

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (!form.reportValidity()) return;

		const data = new FormData(form);
		const turnstileContainer = form.querySelector(".cf-turnstile");
		button.disabled = true;
		setStatus(status, "Subscribing...", "fr-subscribe-status--busy");

		try {
			const response = await fetch(WORKER_SUBSCRIBE_URL, { method: "POST", body: data });
			let result = null;
			try {
				result = await response.json();
			} catch {
				result = null;
			}

			if (response.ok && result?.ok && result.duplicate) {
				setStatus(status, "You're already on the list.", "fr-subscribe-status--ok");
			} else if (response.ok && result?.ok) {
				setStatus(status, "You're subscribed. Watch for the next issue.", "fr-subscribe-status--ok");
				if (Number.isFinite(result.count)) {
					setBadgeCount(result.count);
				}
				form.reset();
			} else if (response.status === 403) {
				setStatus(
					status,
					"Please complete the Turnstile check and try again.",
					"fr-subscribe-status--error",
				);
			} else if (response.status >= 400 && response.status < 500) {
				setStatus(status, "Please check your email and try again.", "fr-subscribe-status--error");
			} else {
				setStatus(
					status,
					"Something went wrong on our side. Please try again soon.",
					"fr-subscribe-status--error",
				);
			}
		} catch {
			setStatus(
				status,
				"Couldn't reach the subscribe service. Try again later.",
				"fr-subscribe-status--error",
			);
		} finally {
			button.disabled = false;
			if (window.turnstile && turnstileContainer) {
				window.turnstile.reset(turnstileContainer);
			}
		}
	});
});
