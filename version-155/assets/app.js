(function () {
  var navButton = document.querySelector('[data-nav-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (navButton && mobileNav) {
    navButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('img[data-cover]').forEach(function (img) {
    img.addEventListener('error', function () {
      var holder = img.closest('.poster');
      if (holder) {
        holder.classList.add('no-cover');
      }
      img.remove();
    });
  });

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var next = hero.querySelector('[data-hero-next]');
    var prev = hero.querySelector('[data-hero-prev]');
    var index = 0;
    var timer = null;

    function showHero(target) {
      if (!slides.length) {
        return;
      }
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restartHero() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        showHero(index + 1);
      }, 6500);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showHero(Number(dot.getAttribute('data-hero-dot')) || 0);
        restartHero();
      });
    });

    if (next) {
      next.addEventListener('click', function () {
        showHero(index + 1);
        restartHero();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showHero(index - 1);
        restartHero();
      });
    }

    showHero(0);
    restartHero();
  }

  var filterInput = document.querySelector('[data-filter-input]');
  var regionSelect = document.querySelector('[data-filter-region]');
  var typeSelect = document.querySelector('[data-filter-type]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
  var emptyState = document.querySelector('[data-empty-state]');

  if (filterInput || regionSelect || typeSelect) {
    var query = new URLSearchParams(window.location.search).get('q');
    if (query && filterInput) {
      filterInput.value = query;
    }

    function applyFilter() {
      var keyword = filterInput ? filterInput.value.trim().toLowerCase() : '';
      var region = regionSelect ? regionSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || '').toLowerCase();
        var cardRegion = card.getAttribute('data-region') || '';
        var cardType = card.getAttribute('data-type') || '';
        var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchRegion = !region || cardRegion === region;
        var matchType = !type || cardType === type;
        var show = matchKeyword && matchRegion && matchType;
        card.hidden = !show;
        if (show) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    [filterInput, regionSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }

  document.querySelectorAll('[data-player]').forEach(function (player) {
    var video = player.querySelector('video');
    var button = player.querySelector('[data-play]');
    var stream = player.getAttribute('data-stream');
    var prepared = false;
    var instance = null;

    function begin() {
      if (!video || !stream) {
        return;
      }

      player.classList.add('is-playing');

      if (prepared) {
        var resume = video.play();
        if (resume && resume.catch) {
          resume.catch(function () {});
        }
        return;
      }

      prepared = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        var nativePlay = video.play();
        if (nativePlay && nativePlay.catch) {
          nativePlay.catch(function () {});
        }
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        instance = new window.Hls({
          maxBufferLength: 30,
          backBufferLength: 30
        });
        instance.loadSource(stream);
        instance.attachMedia(video);
        instance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          var hlsPlay = video.play();
          if (hlsPlay && hlsPlay.catch) {
            hlsPlay.catch(function () {});
          }
        });
        return;
      }

      video.src = stream;
      var directPlay = video.play();
      if (directPlay && directPlay.catch) {
        directPlay.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        begin();
      });
    }

    player.addEventListener('click', function (event) {
      if (event.target === video) {
        return;
      }
      if (event.target.closest('[data-play]')) {
        return;
      }
      begin();
    });

    window.addEventListener('beforeunload', function () {
      if (instance) {
        instance.destroy();
      }
    });
  });
})();
