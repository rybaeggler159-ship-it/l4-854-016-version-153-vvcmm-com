function ready(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

function initMenu() {
  const button = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!button || !menu) {
    return;
  }
  button.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
}

function initHero() {
  const carousel = document.querySelector("[data-hero-carousel]");
  if (!carousel) {
    return;
  }
  const slides = Array.from(carousel.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-hero-dot]"));
  if (!slides.length) {
    return;
  }
  let active = 0;
  let timer = null;

  function show(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, current) => {
      slide.classList.toggle("is-active", current === active);
    });
    dots.forEach((dot, current) => {
      dot.classList.toggle("is-active", current === active);
    });
  }

  function play() {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(active + 1), 6200);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      show(index);
      play();
    });
  });

  show(0);
  play();
}

function initFilters() {
  document.querySelectorAll("[data-filter-panel]").forEach((panel) => {
    const target = document.querySelector(panel.getAttribute("data-target"));
    if (!target) {
      return;
    }
    const cards = Array.from(target.querySelectorAll(".movie-card"));
    const input = panel.querySelector("[data-search-input]");
    const year = panel.querySelector("[data-filter-year]");
    const region = panel.querySelector("[data-filter-region]");
    const type = panel.querySelector("[data-filter-type]");
    const empty = document.querySelector("[data-empty-state]");

    function apply() {
      const keyword = input ? input.value.trim().toLowerCase() : "";
      const yearValue = year ? year.value : "";
      const regionValue = region ? region.value : "";
      const typeValue = type ? type.value : "";
      let visible = 0;

      cards.forEach((card) => {
        const search = (card.getAttribute("data-search") || "").toLowerCase();
        const isMatch = (!keyword || search.includes(keyword))
          && (!yearValue || card.getAttribute("data-year") === yearValue)
          && (!regionValue || card.getAttribute("data-region") === regionValue)
          && (!typeValue || card.getAttribute("data-type") === typeValue);
        card.classList.toggle("is-hidden", !isMatch);
        if (isMatch) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    [input, year, region, type].forEach((control) => {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
  });
}

function initGlobalSearch() {
  const form = document.querySelector("[data-search-page-form]");
  const input = document.querySelector("[data-global-search-input]");
  const results = document.querySelector("#search-results");
  const empty = document.querySelector("[data-search-empty]");
  const data = window.SITE_SEARCH_INDEX || [];
  if (!form || !input || !results || !data.length) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initial = params.get("q") || "";
  input.value = initial;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function render(items) {
    results.innerHTML = items.map((item) => `
        <article class="movie-card" data-title="${escapeHtml(item.title)}">
          <a class="poster-link" href="./${escapeHtml(item.url)}" aria-label="${escapeHtml(item.title)}">
            <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}" loading="lazy">
            <span class="poster-shade"></span>
            <span class="card-year">${escapeHtml(item.year)}</span>
          </a>
          <div class="movie-card-body">
            <div class="movie-card-meta">
              <a href="./category-${escapeHtml(item.categorySlug)}.html">${escapeHtml(item.categoryName)}</a>
              <span>${escapeHtml(item.region)}</span>
            </div>
            <h2><a href="./${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h2>
            <p>${escapeHtml(item.oneLine)}</p>
            <div class="mini-tags">
              ${(item.tags || []).slice(0, 3).map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
        </article>
    `).join("");
    if (empty) {
      empty.classList.toggle("is-visible", items.length === 0);
    }
  }

  function run() {
    const keyword = input.value.trim().toLowerCase();
    if (!keyword) {
      render(data.slice(0, 24));
      return;
    }
    const matches = data.filter((item) => item.search.includes(keyword)).slice(0, 96);
    render(matches);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  input.addEventListener("input", run);
  run();
}

function initPlayers() {
  document.querySelectorAll("[data-player]").forEach((player) => {
    const video = player.querySelector("video");
    const cover = player.querySelector("[data-play-cover]");
    if (!video || !cover) {
      return;
    }
    const stream = video.getAttribute("data-stream");
    let hls = null;

    function start() {
      cover.classList.add("is-hidden");
      if (!stream) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        if (!video.src) {
          video.src = stream;
        }
        video.play().catch(() => {});
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        if (!hls) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
        } else {
          video.play().catch(() => {});
        }
        return;
      }
      video.src = stream;
      video.play().catch(() => {});
    }

    cover.addEventListener("click", start);
    video.addEventListener("click", () => {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener("play", () => cover.classList.add("is-hidden"));
  });
}

ready(() => {
  initMenu();
  initHero();
  initFilters();
  initGlobalSearch();
  initPlayers();
});
