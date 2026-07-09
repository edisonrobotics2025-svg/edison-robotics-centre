/**
 * Dedicated Events page — renders every upcoming event as one card each.
 * Events with multiple posters get their own small, independent gallery
 * (prev/next + dots + autoplay) inside the card; events never get split
 * into multiple cards.
 */

import { loadEvents } from "./events-data.js";
import { crossfadeImage, preloadImage, renderRegisterButtons } from "./poster-fade.js";

const GALLERY_DURATION_MS = 5000;

const list = document.getElementById("eventsList");
const heroCount = document.getElementById("eventsHeroCount");

if (list) {
  init();
}

async function init() {
  let events = [];

  try {
    events = await loadEvents();
  } catch (err) {
    console.error("Failed to load events", err);
    list.innerHTML = '<p class="events-empty">Unable to load events right now.</p>';
    if (heroCount) heroCount.textContent = "Unable to load events";
    return;
  }

  updateHeroCount(events.length);

  if (!events.length) {
    list.innerHTML = '<p class="events-empty">No upcoming events at the moment. Please check back soon!</p>';
    return;
  }

  list.innerHTML = "";
  events.forEach(event => list.appendChild(buildEventCard(event)));

  focusLinkedEvent();
}

function updateHeroCount(count) {
  if (!heroCount) return;
  heroCount.textContent = count === 1 ? "1 Upcoming Event" : count + " Upcoming Events";
}

function buildEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.id = "event-" + event.id;

  card.innerHTML = `
    <div class="event-card-gallery">
      <div class="event-card-image">
        <img src="${event.posters[0]}" alt="${escapeHtml(event.title)}" loading="lazy">
      </div>
      <button type="button" class="gallery-arrow gallery-arrow-prev" aria-label="Previous poster">&#10094;</button>
      <button type="button" class="gallery-arrow gallery-arrow-next" aria-label="Next poster">&#10095;</button>
      <div class="gallery-dots"></div>
    </div>
    <div class="event-card-body">
      <h2>${escapeHtml(event.title)}</h2>
      <div class="event-card-meta">
        ${buildMetaRow('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>', event.dateLabel)}
        ${buildMetaRow('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', event.timeLabel)}
        ${buildMetaRow('<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>', event.venue)}
      </div>
      <p class="event-card-desc">${escapeHtml(event.description)}</p>
      <div class="event-card-register-group"></div>
      ${event.telegramLink ? `<a class="event-card-telegram-link" href="${event.telegramLink}" target="_blank" rel="noopener">Join our Telegram group after registering →</a>` : ""}
    </div>
  `;

  renderRegisterButtons(card.querySelector(".event-card-register-group"), event.registerLinks, "event-register-btn");
  initGallery(card, event.posters);

  return card;
}

function buildMetaRow(iconPaths, value) {
  if (!value) return "";
  return `<div class="event-card-meta-row"><svg viewBox="0 0 24 24" class="meta-icon" aria-hidden="true">${iconPaths}</svg><span>${escapeHtml(value)}</span></div>`;
}

function initGallery(card, posters) {
  const img = card.querySelector(".event-card-image img");
  const prevBtn = card.querySelector(".gallery-arrow-prev");
  const nextBtn = card.querySelector(".gallery-arrow-next");
  const dotsWrap = card.querySelector(".gallery-dots");

  if (posters.length < 2) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    return;
  }

  let index = 0;
  let timer = null;

  posters.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "gallery-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", "Poster " + (i + 1));
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  card.addEventListener("mouseenter", stop);
  card.addEventListener("mouseleave", start);

  start();

  function goTo(newIndex) {
    index = (newIndex + posters.length) % posters.length;
    crossfadeImage(img, posters[index]);
    [...dotsWrap.children].forEach((dot, i) => dot.classList.toggle("active", i === index));
    preloadImage(posters[(index + 1) % posters.length]);
    restart();
  }

  function start() {
    timer = setInterval(() => goTo(index + 1), GALLERY_DURATION_MS);
  }

  function stop() {
    clearInterval(timer);
  }

  function restart() {
    stop();
    start();
  }
}

function focusLinkedEvent() {
  if (!location.hash) return;
  const target = document.querySelector(location.hash);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("event-card-highlight");
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
