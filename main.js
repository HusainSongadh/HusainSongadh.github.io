(function () {
	"use strict";

	var doc = document;
	var root = doc.documentElement;
	var loader = doc.getElementById("loader");
	var navToggle = doc.getElementById("nav-toggle");
	var navMenu = doc.getElementById("nav-menu");
	var themeToggle = doc.getElementById("theme-toggle");
	var yearEl = doc.getElementById("year");
	var contactForm = doc.getElementById("contact-form");
	var formHint = doc.getElementById("form-hint");

	/* Loading screen */
	function hideLoader() {
		if (!loader) return;
		loader.classList.add("is-done");
		setTimeout(function () {
			if (loader && loader.parentNode) {
				loader.parentNode.removeChild(loader);
			}
		}, 650);
	}

	if (doc.readyState === "complete") {
		requestAnimationFrame(hideLoader);
	} else {
		window.addEventListener("load", hideLoader);
		setTimeout(hideLoader, 4000);
	}

	/* Theme */
	var stored = localStorage.getItem("hs-theme");
	if (stored === "light" || stored === "dark") {
		root.setAttribute("data-theme", stored);
	} else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
		root.setAttribute("data-theme", "light");
	}

	if (themeToggle) {
		themeToggle.addEventListener("click", function () {
			var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
			root.setAttribute("data-theme", next);
			localStorage.setItem("hs-theme", next);
		});
	}

	/* Year */
	if (yearEl) {
		yearEl.textContent = String(new Date().getFullYear());
	}

	/* Mobile nav */
	function closeNav() {
		if (!navMenu || !navToggle) return;
		navMenu.classList.remove("is-open");
		navToggle.setAttribute("aria-expanded", "false");
		navToggle.setAttribute("aria-label", "Open menu");
	}

	if (navToggle && navMenu) {
		navToggle.addEventListener("click", function () {
			var open = navMenu.classList.toggle("is-open");
			navToggle.setAttribute("aria-expanded", open ? "true" : "false");
			navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
		});

		navMenu.querySelectorAll("a").forEach(function (link) {
			link.addEventListener("click", closeNav);
		});
	}

	doc.addEventListener("keydown", function (e) {
		if (e.key === "Escape") closeNav();
	});

	/* Smooth scroll offset for sticky header */
	var header = doc.querySelector(".site-header");
	var headerOffset = function () {
		return header ? header.offsetHeight : 0;
	};

	doc.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
		var id = anchor.getAttribute("href");
		if (!id || id === "#") return;
		anchor.addEventListener("click", function (e) {
			var target = doc.querySelector(id);
			if (!target) return;
			e.preventDefault();
			var top = target.getBoundingClientRect().top + window.scrollY - headerOffset() - 8;
			window.scrollTo({ top: top, behavior: "smooth" });
			if (history.replaceState) {
				history.replaceState(null, "", id);
			}
		});
	});

	/* Active nav link on scroll */
	var sections = Array.from(doc.querySelectorAll("main section[id]"));
	var navLinks = Array.from(doc.querySelectorAll('.nav__menu a[href^="#"]'));

	function setActiveNav() {
		var pos = window.scrollY + headerOffset() + 40;
		var current = "";
		for (var i = sections.length - 1; i >= 0; i--) {
			var sec = sections[i];
			if (sec.offsetTop <= pos) {
				current = "#" + sec.id;
				break;
			}
		}
		navLinks.forEach(function (a) {
			var on = a.getAttribute("href") === current;
			if (on) a.setAttribute("aria-current", "page");
			else a.removeAttribute("aria-current");
		});
	}

	window.addEventListener("scroll", setActiveNav, { passive: true });
	setActiveNav();

	/* IntersectionObserver — reveals & skill bars */
	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (!reduceMotion && "IntersectionObserver" in window) {
		var revealEls = doc.querySelectorAll(".reveal");
		var revealObs = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (en) {
					if (en.isIntersecting) {
						en.target.classList.add("is-visible");
						revealObs.unobserve(en.target);
					}
				});
			},
			{ rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
		);
		revealEls.forEach(function (el) {
			revealObs.observe(el);
		});

		var fills = doc.querySelectorAll(".skill-bars__fill");
		var skillObs = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (en) {
					if (en.isIntersecting) {
						en.target.classList.add("is-visible");
						skillObs.unobserve(en.target);
					}
				});
			},
			{ threshold: 0.2 }
		);
		fills.forEach(function (f) {
			skillObs.observe(f);
		});
	} else {
		doc.querySelectorAll(".reveal").forEach(function (el) {
			el.classList.add("is-visible");
		});
		doc.querySelectorAll(".skill-bars__fill").forEach(function (f) {
			f.classList.add("is-visible");
		});
	}

	/* Contact form — FormSubmit AJAX (delivers to inbox; no mail client) */
	var formEndpoint =
		"https://formsubmit.co/ajax/" + encodeURIComponent("husain.songadhwala.hs@gmail.com");

	if (contactForm && formHint) {
		contactForm.addEventListener("submit", function (e) {
			e.preventDefault();
			var name = doc.getElementById("cf-name");
			var email = doc.getElementById("cf-email");
			var message = doc.getElementById("cf-message");
			var gotcha = doc.getElementById("cf-gotcha");
			var submitBtn = doc.getElementById("cf-submit");
			if (!name || !email || !message) return;

			if (!contactForm.checkValidity()) {
				formHint.textContent = "Please fill in all fields.";
				contactForm.reportValidity();
				return;
			}

			if (gotcha && gotcha.value.replace(/\s/g, "") !== "") {
				formHint.textContent = "Unable to send. Please try again.";
				return;
			}

			var originalLabel = submitBtn ? submitBtn.textContent : "";
			if (submitBtn) {
				submitBtn.disabled = true;
				submitBtn.classList.add("is-busy");
				submitBtn.textContent = "Sending…";
			}
			formHint.textContent = "";
			formHint.removeAttribute("data-state");

			var payload = {
				name: name.value.trim(),
				email: email.value.trim(),
				message: message.value.trim(),
				_subject: "Portfolio contact from " + name.value.trim(),
				_replyto: email.value.trim(),
				_url: window.location.href
			};

			fetch(formEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify(payload)
			})
				.then(function (res) {
					return res.json().then(function (data) {
						return { ok: res.ok, data: data };
					});
				})
				.then(function (result) {
					var data = result.data;
					var ok =
						result.ok &&
						data &&
						(data.success === true || data.success === "true");
					if (ok) {
						formHint.textContent = "Thanks — your message was sent. I’ll get back to you soon.";
						formHint.setAttribute("data-state", "success");
						contactForm.reset();
					} else {
						var msg =
							(data && (data.message || data.error)) ||
							"Could not send. Email me at husain.songadhwala.hs@gmail.com.";
						formHint.textContent = msg;
						formHint.setAttribute("data-state", "error");
					}
				})
				.catch(function () {
					formHint.textContent =
						"Network error. Please try again or email husain.songadhwala.hs@gmail.com.";
					formHint.setAttribute("data-state", "error");
				})
				.finally(function () {
					if (submitBtn) {
						submitBtn.disabled = false;
						submitBtn.classList.remove("is-busy");
						submitBtn.textContent = originalLabel || "Send message";
					}
				});
		});
	}
})();
