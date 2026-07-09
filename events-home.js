/**
 * Homepage "featured event" spotlight.
 *
 * A two-column showcase (poster left, details right) rather than a plain
 * image carousel: when the active EVENT changes, the whole right-hand
 * panel (badge, title, date/time/venue, description, countdown, buttons)
 * crossfades together with the poster. When only the POSTER changes
 * (an event with multiple posters cycling through them), the info panel
 * stays put and only the image fades — the event details don't change
 * until every poster for that event has been shown.
 *
 * Events and their posters are flattened into a single ordered slide list
 * ([event0/poster0, event0/poster1, event1/poster0, ...]) so autoplay and
 * the prev/next arrows only ever have to do one thing: step to the next
 * slide. The dot indicators represent EVENTS, not individual posters —
 * clicking a dot jumps straight to that event's first poster.
 */

import { loadEvents } from "./events-data.js";
import { crossfadeImage, preloadImage, renderRegisterButtons } from "./poster-fade.js";

const SLIDE_DURATION_MS = 7000;
const COUNTDOWN_TICK_MS = 30000;

const elements = {
  carousel: document.getElementById("featuredCarousel"),
  track: document.getElementById("featuredTrack"),
  poster: document.getElementById("featuredPosterImg"),
  subdots: document.getElementById("featuredSubdots"),
  info: document.getElementById("featuredEventInfo"),
  title: document.getElementById("featuredEventTitle"),
  date: document.getElementById("featuredEventDate"),
  time: document.getElementById("featuredEventTime"),
  venue: document.getElementById("featuredEventVenue"),
  desc: document.getElementById("featuredEventDesc"),
  countdown: document.getElementById("featuredCountdown"),
  countdownTimer: document.getElementById("featuredCountdownTimer"),
  registerGroup: document.getElementById("featuredRegisterGroup"),
  telegramLink: document.getElementById("featuredTelegramLink"),
  detailsBtn: document.getElementById("featuredLearnMoreBtn"),
  dots: document.getElementById("featuredDots"),
  prevBtn: document.getElementById("featuredPrev"),
  nextBtn: document.getElementById("featuredNext")
};

if (elements.track) {
  init();
}

async function init() {
  let slides = [];
  let currentIndex = 0;
  let autoplayTimer = null;
  let countdownTimer = null;
  let activeEventDate = null;

  try {
    const events = await loadEvents();
    slides = buildSlides(events);
  } catch (err) {
    console.error("Failed to load events", err);
    renderError();
    return;
  }

  if (!slides.length) {
    renderEmpty();
    return;
  }

  buildEventDots(slides);
  renderSlide(0, { instant: true });
  startAutoplay();
  startCountdownTicker();

  elements.prevBtn?.addEventListener("click", () => {
    goTo(currentIndex - 1);
    restartAutoplay();
  });

  elements.nextBtn?.addEventListener("click", () => {
    goTo(currentIndex + 1);
    restartAutoplay();
  });

  elements.carousel?.addEventListener("mouseenter", stopAutoplay);
  elements.carousel?.addEventListener("mouseleave", startAutoplay);

  let touchStartX = 0;
  elements.carousel?.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  elements.carousel?.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 40) {
      goTo(currentIndex + (delta < 0 ? 1 : -1));
    }
    startAutoplay();
  }, { passive: true });

  function buildSlides(events) {
    const flat = [];
    events.forEach((event, eventIndex) => {
      event.posters.forEach((poster, posterIndex) => {
        flat.push({
          event,
          eventIndex,
          poster,
          posterIndex,
          postersTotal: event.posters.length
        });
      });
    });
    return flat;
  }

  function buildEventDots(slideList) {
    if (!elements.dots) return;
    elements.dots.innerHTML = "";

    const seenEvents = [];
    slideList.forEach(slide => {
      if (!seenEvents.includes(slide.eventIndex)) {
        seenEvents.push(slide.eventIndex);

        const dot = document.createElement("button");
        dot.className = "event-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", "Go to " + slide.event.title);
        dot.addEventListener("click", () => {
          const targetIndex = slideList.findIndex(s => s.eventIndex === slide.eventIndex);
          goTo(targetIndex);
          restartAutoplay();
        });
        elements.dots.appendChild(dot);
      }
    });
  }

  function goTo(index) {
    const nextIndex = (index + slides.length) % slides.length;
    renderSlide(nextIndex);
  }

  function renderSlide(index, { instant = false } = {}) {
    const previous = slides[currentIndex];
    const slide = slides[index];
    const isNewEvent = instant || !previous || previous.eventIndex !== slide.eventIndex;

    currentIndex = index;

    crossfadeImage(elements.poster, slide.poster, slide.event.title);
    renderSubdots(slide);
    updateDots(slide.eventIndex);

    if (isNewEvent) {
      updateInfoPanel(slide.event);
    }

    const next = slides[(index + 1) % slides.length];
    preloadImage(next?.poster);
  }

  function updateInfoPanel(event) {
    if (!elements.info) return;

    elements.info.classList.add("is-fading");
    window.setTimeout(() => {
      if (elements.title) elements.title.textContent = event.title;
      if (elements.date) elements.date.textContent = event.dateLabel;
      if (elements.time) elements.time.textContent = event.timeLabel;
      if (elements.venue) elements.venue.textContent = event.venue;
      if (elements.desc) elements.desc.textContent = event.description;
      renderRegisterButtons(elements.registerGroup, event.registerLinks, "event-register-btn");
      if (elements.telegramLink) {
        elements.telegramLink.hidden = !event.telegramLink;
        elements.telegramLink.href = event.telegramLink || "#";
      }
      if (elements.detailsBtn) elements.detailsBtn.href = "events.html#event-" + event.id;

      activeEventDate = event.dateObj;
      renderCountdown();

      elements.info.classList.remove("is-fading");
    }, 200);
  }

  function startCountdownTicker() {
    renderCountdown();
    countdownTimer = setInterval(renderCountdown, COUNTDOWN_TICK_MS);
  }

  function renderCountdown() {
    if (!elements.countdown || !elements.countdownTimer || !activeEventDate) return;

    const diffMs = activeEventDate.getTime() - Date.now();

    if (isNaN(activeEventDate.getTime()) || diffMs <= 0) {
      elements.countdown.hidden = true;
      return;
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    elements.countdown.hidden = false;
    elements.countdownTimer.innerHTML =
      countdownUnit(days, "Days") +
      '<span class="countdown-sep">:</span>' +
      countdownUnit(hours, "Hrs") +
      '<span class="countdown-sep">:</span>' +
      countdownUnit(minutes, "Min");
  }

  function countdownUnit(value, label) {
    const padded = String(value).padStart(2, "0");
    return '<div class="countdown-unit"><span class="countdown-num">' + padded +
      '</span><span class="countdown-unit-label">' + label + '</span></div>';
  }

  function renderSubdots(slide) {
    if (!elements.subdots) return;
    elements.subdots.innerHTML = "";

    if (slide.postersTotal < 2) {
      elements.subdots.hidden = true;
      return;
    }

    elements.subdots.hidden = false;
    for (let i = 0; i < slide.postersTotal; i++) {
      const dot = document.createElement("span");
      dot.className = "poster-subdot" + (i === slide.posterIndex ? " active" : "");
      elements.subdots.appendChild(dot);
    }
  }

  function updateDots(eventIndex) {
    if (!elements.dots) return;
    [...elements.dots.children].forEach((dot, i) => {
      dot.classList.toggle("active", i === eventIndex);
    });
  }

  function startAutoplay() {
    if (slides.length < 2) return;
    autoplayTimer = setInterval(() => goTo(currentIndex + 1), SLIDE_DURATION_MS);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }
}

function renderEmpty() {
  if (elements.track) {
    elements.track.innerHTML = '<p class="featured-empty">No upcoming events at the moment. Please check back soon!</p>';
  }
  hideControls();
}

function renderError() {
  if (elements.track) {
    elements.track.innerHTML = '<p class="featured-empty">Unable to load events right now.</p>';
  }
  hideControls();
}

function hideControls() {
  if (elements.prevBtn) elements.prevBtn.style.display = "none";
  if (elements.nextBtn) elements.nextBtn.style.display = "none";
  if (elements.dots) elements.dots.style.display = "none";
  if (elements.info) elements.info.style.display = "none";
}
