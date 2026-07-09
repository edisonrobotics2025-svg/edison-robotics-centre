/**
 * Shared poster-image transition + preloading helpers, used by both the
 * homepage featured carousel and the events-page poster galleries so the
 * two never diverge in feel.
 */

export function crossfadeImage(imgEl, src, alt) {
  if (!imgEl || imgEl.src.endsWith(src)) return;

  imgEl.classList.add("is-fading");

  window.setTimeout(() => {
    imgEl.src = src;
    imgEl.alt = alt || "";
    imgEl.classList.remove("is-fading");
  }, 220);
}

export function preloadImage(src) {
  if (!src) return;
  const img = new Image();
  img.src = src;
}

/**
 * Renders one <a class="{className}"> per {label, url} entry into container.
 * Used for events with more than one registration link (e.g. separate
 * Junior / Senior category forms) — every UI module that shows a register
 * button renders it the same way via this helper.
 */
export function renderRegisterButtons(container, links, className) {
  if (!container) return;
  container.innerHTML = "";
  (links || []).forEach(link => {
    const a = document.createElement("a");
    a.className = className;
    a.href = link.url || "#";
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = link.label || "Register Now";
    container.appendChild(a);
  });
}
