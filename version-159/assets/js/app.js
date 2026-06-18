(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.classList.add('image-fallback');
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function setSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        setSlide(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        setSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        setSlide(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setSlide(index + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  });

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function runFilters() {
    var input = document.querySelector('[data-filter-input]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var query = normalize(input ? input.value : '');
    var activeGenre = document.querySelector('[data-genre-filter].is-active');
    var activeCategory = document.querySelector('[data-category-filter].is-active');
    var genre = normalize(activeGenre ? activeGenre.getAttribute('data-genre-filter') : '');
    var category = normalize(activeCategory ? activeCategory.getAttribute('data-category-filter') : '');

    cards.forEach(function (card) {
      var keywords = normalize(card.getAttribute('data-keywords'));
      var genres = normalize(card.getAttribute('data-genre'));
      var categories = normalize(card.getAttribute('data-category'));
      var matchedQuery = !query || keywords.indexOf(query) !== -1;
      var matchedGenre = !genre || genres.indexOf(genre) !== -1;
      var matchedCategory = !category || categories.indexOf(category) !== -1;
      card.classList.toggle('is-hidden', !(matchedQuery && matchedGenre && matchedCategory));
    });
  }

  document.querySelectorAll('[data-filter-input]').forEach(function (input) {
    input.addEventListener('input', runFilters);
  });

  document.querySelectorAll('[data-genre-filter], [data-category-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      var name = button.hasAttribute('data-genre-filter') ? 'data-genre-filter' : 'data-category-filter';
      document.querySelectorAll('[' + name + ']').forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });
      runFilters();
    });
  });

  document.querySelectorAll('[data-player]').forEach(function (shell) {
    var video = shell.querySelector('video');
    var cover = shell.querySelector('.player-cover');
    var ready = false;
    var stream = video ? video.getAttribute('data-stream') : '';
    var hls = null;

    function loadStream() {
      if (!video || ready || !stream) {
        return;
      }
      ready = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }
    }

    function playVideo() {
      if (!video) {
        return;
      }
      loadStream();
      if (cover) {
        cover.classList.add('is-hidden');
      }
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          if (cover) {
            cover.classList.remove('is-hidden');
          }
        });
      }
    }

    if (cover) {
      cover.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        }
      });
      video.addEventListener('play', function () {
        if (cover) {
          cover.classList.add('is-hidden');
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  });
})();
