(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMobileMenu() {
    var button = document.querySelector("[data-mobile-menu-button]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        restart();
      });
    });

    show(0);
    restart();
  }

  function setupSearchRedirect() {
    var form = document.querySelector("[data-site-search-form]");
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = form.querySelector("input[name='q']");
      var query = input ? input.value.trim() : "";
      var target = "./search.html";
      if (query) {
        target += "?q=" + encodeURIComponent(query);
      }
      window.location.href = target;
    });
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

    panels.forEach(function (panel) {
      var input = panel.querySelector("[data-filter-search]");
      var yearSelect = panel.querySelector("[data-filter-year]");
      var typeSelect = panel.querySelector("[data-filter-type]");
      var categorySelect = panel.querySelector("[data-filter-category]");
      var reset = panel.querySelector("[data-filter-reset]");
      var counter = panel.querySelector("[data-result-count]");
      var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";

      if (input && initialQuery) {
        input.value = initialQuery;
      }

      function matchesYear(card, value) {
        if (!value) {
          return true;
        }
        var year = card.getAttribute("data-year") || "";
        if (value === "2019") {
          var number = parseInt((year.match(/\d{4}/) || ["0"])[0], 10);
          return number > 0 && number <= 2019;
        }
        return year.indexOf(value) !== -1;
      }

      function applyFilters() {
        var query = input ? input.value.trim().toLowerCase() : "";
        var year = yearSelect ? yearSelect.value : "";
        var type = typeSelect ? typeSelect.value : "";
        var category = categorySelect ? categorySelect.value : "";
        var visible = 0;

        cards.forEach(function (card) {
          var search = (card.getAttribute("data-search") || "").toLowerCase();
          var cardType = card.getAttribute("data-type") || "";
          var cardCategory = card.getAttribute("data-category") || "";
          var ok = true;

          if (query && search.indexOf(query) === -1) {
            ok = false;
          }
          if (ok && !matchesYear(card, year)) {
            ok = false;
          }
          if (ok && type && cardType.indexOf(type) === -1) {
            ok = false;
          }
          if (ok && category && cardCategory !== category) {
            ok = false;
          }

          card.classList.toggle("hidden-by-filter", !ok);
          if (ok) {
            visible += 1;
          }
        });

        if (counter) {
          counter.textContent = String(visible);
        }
      }

      [input, yearSelect, typeSelect, categorySelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", applyFilters);
          control.addEventListener("change", applyFilters);
        }
      });

      if (reset) {
        reset.addEventListener("click", function () {
          if (input) {
            input.value = "";
          }
          if (yearSelect) {
            yearSelect.value = "";
          }
          if (typeSelect) {
            typeSelect.value = "";
          }
          if (categorySelect) {
            categorySelect.value = "";
          }
          applyFilters();
        });
      }

      applyFilters();
    });
  }

  var hlsPromise = null;

  function loadHlsLibrary() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsPromise) {
      return hlsPromise;
    }

    hlsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js";
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = function () {
        reject(new Error("hls.js 加载失败"));
      };
      document.head.appendChild(script);
    });

    return hlsPromise;
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".js-player"));

    players.forEach(function (player) {
      var video = player.querySelector("video");
      var playButtons = Array.prototype.slice.call(player.querySelectorAll("[data-player-play]"));
      var muteButton = player.querySelector("[data-player-mute]");
      var fullscreenButton = player.querySelector("[data-player-fullscreen]");

      if (!video) {
        return;
      }

      function markState() {
        player.classList.toggle("is-playing", !video.paused && !video.ended);
      }

      function attachSource() {
        if (video.dataset.ready === "true") {
          return Promise.resolve();
        }

        var source = video.getAttribute("data-src");
        if (!source) {
          return Promise.resolve();
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.dataset.ready = "true";
          return Promise.resolve();
        }

        return loadHlsLibrary()
          .then(function (Hls) {
            if (Hls && Hls.isSupported()) {
              var hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
              });
              hls.loadSource(source);
              hls.attachMedia(video);
              video._hlsInstance = hls;
            } else {
              video.src = source;
            }
            video.dataset.ready = "true";
          })
          .catch(function () {
            video.src = source;
            video.dataset.ready = "true";
          });
      }

      function togglePlay() {
        attachSource().then(function () {
          if (video.paused || video.ended) {
            var playResult = video.play();
            if (playResult && typeof playResult.catch === "function") {
              playResult.catch(function () {});
            }
          } else {
            video.pause();
          }
        });
      }

      playButtons.forEach(function (button) {
        button.addEventListener("click", togglePlay);
      });

      if (muteButton) {
        muteButton.addEventListener("click", function () {
          video.muted = !video.muted;
          muteButton.textContent = video.muted ? "取消静音" : "静音";
        });
      }

      if (fullscreenButton) {
        fullscreenButton.addEventListener("click", function () {
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (player.requestFullscreen) {
            player.requestFullscreen();
          }
        });
      }

      video.addEventListener("play", markState);
      video.addEventListener("pause", markState);
      video.addEventListener("ended", markState);
      video.addEventListener("loadedmetadata", markState);
    });
  }

  ready(function () {
    setupMobileMenu();
    setupHero();
    setupSearchRedirect();
    setupFilters();
    setupPlayers();
  });
})();
