"use strict";

/* Future source: site_settings table. */
const SITE_CONFIG = Object.freeze({
    whatsapp: "201000000000",
    facebook: "https://www.facebook.com/",
    linkedin: "https://www.linkedin.com/"
});

let currentLanguage = "ar";

function getTranslation(key, language = currentLanguage) {
    return key.split(".").reduce((value, part) => value && value[part], translations[language]);
}

function getStoredLanguage() {
    try { return localStorage.getItem("preferredLanguage"); } catch (_) { return null; }
}

function storeLanguage(language) {
    try { localStorage.setItem("preferredLanguage", language); } catch (_) { /* file:// fallback */ }
}

function updateContactLinks() {
    const message = currentLanguage === "ar" ? "مرحبًا، أريد مناقشة مشروع تسويق وإعلانات." : "Hello, I'd like to discuss a marketing and advertising project.";
    const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
    document.querySelectorAll("[data-config-whatsapp]").forEach((link) => { link.href = whatsappUrl; });
    document.querySelectorAll("[data-config-facebook]").forEach((link) => { link.href = SITE_CONFIG.facebook; });
    document.querySelectorAll("[data-config-linkedin]").forEach((link) => { link.href = SITE_CONFIG.linkedin; });
}

function applyLanguage(language) {
    if (!translations[language]) return;
    currentLanguage = language;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const value = getTranslation(element.dataset.i18n, language);
        if (typeof value === "string") element.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
        const value = getTranslation(element.dataset.i18nHtml, language);
        if (typeof value === "string") element.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        const value = getTranslation(element.dataset.i18nPlaceholder, language);
        if (typeof value === "string") element.placeholder = value;
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
        const value = getTranslation(element.dataset.i18nAlt, language);
        if (typeof value === "string") element.alt = value;
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
        const value = getTranslation(element.dataset.i18nAriaLabel, language);
        if (typeof value === "string") element.setAttribute("aria-label", value);
    });

    const isPortfolioPage = Boolean(document.querySelector(".portfolio-page"));
    document.title = isPortfolioPage
        ? `${translations[language].portfolio.allTitle} | ${translations[language].profile.name}`
        : translations[language].meta.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
        description.content = isPortfolioPage
            ? translations[language].portfolio.allSubtitle
            : translations[language].meta.description;
    }
    const languageButton = document.getElementById("language-button");
    if (languageButton) {
        languageButton.textContent = language === "ar" ? "EN" : "AR";
        languageButton.setAttribute("aria-label", language === "ar" ? "Switch to English" : "التبديل إلى العربية");
    }
    updateContactLinks();
}

function initLanguage() {
    const saved = getStoredLanguage();
    applyLanguage(saved === "en" ? "en" : "ar");
    document.getElementById("language-button")?.addEventListener("click", () => {
        const nextLanguage = currentLanguage === "ar" ? "en" : "ar";
        applyLanguage(nextLanguage);
        storeLanguage(nextLanguage);
    });
}

function initFadeIn() {
    const elements = document.querySelectorAll(".fade-in");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        });
    }, { threshold: .08, rootMargin: "0px 0px -24px" });
    elements.forEach((element) => observer.observe(element));
}

function initLightbox() {
    const dialog = document.getElementById("lightbox");
    const image = document.getElementById("lightbox-image");
    const caption = document.getElementById("lightbox-caption");
    const items = [...document.querySelectorAll(".portfolio-item")];
    if (!dialog || !image || !caption || !items.length) return;
    let activeIndex = 0;
    let lastFocused = null;

    const render = (index) => {
        activeIndex = (index + items.length) % items.length;
        const item = items[activeIndex];
        image.src = item.dataset.image;
        image.alt = item.querySelector("img")?.alt || "";
        const title = getTranslation(item.dataset.titleKey) || "";
        caption.textContent = `${title} · ${activeIndex + 1} / ${items.length}`;
    };
    const open = (index) => {
        lastFocused = document.activeElement;
        render(index);
        dialog.classList.add("is-open");
        dialog.setAttribute("aria-hidden", "false");
        document.body.classList.add("lightbox-open");
        dialog.querySelector(".lightbox-close")?.focus();
    };
    const close = () => {
        dialog.classList.remove("is-open");
        dialog.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lightbox-open");
        image.src = "";
        lastFocused?.focus();
    };

    items.forEach((item, index) => item.addEventListener("click", () => open(index)));
    dialog.querySelector(".lightbox-close")?.addEventListener("click", close);
    dialog.querySelector(".lightbox-prev")?.addEventListener("click", () => render(activeIndex - 1));
    dialog.querySelector(".lightbox-next")?.addEventListener("click", () => render(activeIndex + 1));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    document.addEventListener("keydown", (event) => {
        if (!dialog.classList.contains("is-open")) return;
        if (event.key === "Escape") close();
        if (event.key === "ArrowLeft") render(activeIndex - 1);
        if (event.key === "ArrowRight") render(activeIndex + 1);
    });
}

function initContactForm() {
    const form = document.getElementById("contact-form");
    const success = document.getElementById("form-success");
    if (!form) return;
    const fields = [...form.querySelectorAll("input, textarea")];

    const clearError = (field) => {
        const group = field.closest(".form-group");
        group?.classList.remove("has-error");
        field.removeAttribute("aria-invalid");
        const error = group?.querySelector(".field-error");
        if (error) error.textContent = "";
    };
    const setError = (field, type) => {
        const group = field.closest(".form-group");
        group?.classList.add("has-error");
        field.setAttribute("aria-invalid", "true");
        const error = group?.querySelector(".field-error");
        if (error) error.textContent = getTranslation(`contact.form.errors.${type}`);
    };
    const validate = (field) => {
        clearError(field);
        const value = field.value.trim();
        if (!value) { setError(field, "required"); return false; }
        if (field.type === "tel" && value.replace(/\D/g, "").length < 8) { setError(field, "phone"); return false; }
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError(field, "email"); return false; }
        if (field.name === "message" && value.length < 15) { setError(field, "message"); return false; }
        return true;
    };

    fields.forEach((field) => field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validate(field);
    }));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        success?.classList.remove("is-visible");
        const valid = fields.map(validate).every(Boolean);
        if (!valid) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
        form.reset();
        success?.classList.add("is-visible");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initLanguage();
    initFadeIn();
    initLightbox();
    initContactForm();
    updateContactLinks();
    const year = document.getElementById("current-year");
    if (year) year.textContent = new Date().getFullYear();
});
