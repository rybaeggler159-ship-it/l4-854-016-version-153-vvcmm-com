(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-search-input]'));
  searchInputs.forEach(function (input) {
    input.addEventListener('input', function () {
      applySearchAndFilter();
    });
  });

  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var activeFilter = '全部';
  filterButtons.forEach(function (button) {
    if (button.getAttribute('data-filter') === activeFilter) {
      button.classList.add('active');
    }
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter') || '全部';
      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      applySearchAndFilter();
    });
  });

  function applySearchAndFilter() {
    var query = searchInputs.map(function (input) {
      return input.value.trim().toLowerCase();
    }).filter(Boolean).join(' ');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    cards.forEach(function (card) {
      var keywords = (card.getAttribute('data-keywords') || card.textContent || '').toLowerCase();
      var matchesSearch = !query || keywords.indexOf(query) !== -1;
      var matchesFilter = activeFilter === '全部' || keywords.indexOf(activeFilter.toLowerCase()) !== -1;
      card.classList.toggle('is-hidden', !(matchesSearch && matchesFilter));
    });
  }

  var hlsLoading = false;
  var hlsCallbacks = [];

  function loadHls(callback) {
    if (window.Hls) {
      callback();
      return;
    }
    hlsCallbacks.push(callback);
    if (hlsLoading) {
      return;
    }
    hlsLoading = true;
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.async = true;
    script.onload = function () {
      var callbacks = hlsCallbacks.slice();
      hlsCallbacks = [];
      callbacks.forEach(function (item) {
        item();
      });
    };
    script.onerror = function () {
      hlsCallbacks = [];
    };
    document.head.appendChild(script);
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('[data-play]');
    var message = shell.querySelector('[data-player-message]');
    var loaded = false;
    var hlsInstance = null;

    function setMessage(text) {
      if (message) {
        message.textContent = text || '';
      }
    }

    function playVideo() {
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          shell.classList.remove('is-playing');
        });
      }
    }

    function attachSource() {
      var src = video.getAttribute('data-src');
      if (!src) {
        return;
      }
      setMessage('正在加载...');
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        loaded = true;
        return;
      }
      loadHls(function () {
        if (!window.Hls || !window.Hls.isSupported()) {
          setMessage('暂时无法加载播放');
          return;
        }
        hlsInstance = new window.Hls({
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setMessage('');
          playVideo();
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && hlsInstance) {
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
            } else {
              setMessage('暂时无法加载播放');
            }
          }
        });
        loaded = true;
      });
    }

    function startPlayer() {
      shell.classList.add('is-playing');
      if (!loaded) {
        attachSource();
      } else {
        playVideo();
      }
    }

    if (button) {
      button.addEventListener('click', startPlayer);
    }
    shell.addEventListener('click', function (event) {
      if (event.target === video && !loaded) {
        startPlayer();
      }
    });
    video.addEventListener('playing', function () {
      setMessage('');
      shell.classList.add('is-playing');
    });
    video.addEventListener('pause', function () {
      if (!video.ended) {
        shell.classList.remove('is-playing');
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
})();
