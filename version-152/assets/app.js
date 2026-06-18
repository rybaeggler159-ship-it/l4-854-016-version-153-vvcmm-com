(function () {
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let index = 0;
    let timer = null;

    const render = function (nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    };

    const start = function () {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        render(index + 1);
      }, 5000);
    };

    if (prev) {
      prev.addEventListener('click', function () {
        render(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        render(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        render(Number(dot.dataset.heroDot || 0));
        start();
      });
    });

    render(0);
    start();
  }

  const filterPanel = document.querySelector('[data-filter-panel]');

  if (filterPanel) {
    const input = filterPanel.querySelector('[data-filter-input]');
    const typeSelect = filterPanel.querySelector('[data-filter-type]');
    const regionSelect = filterPanel.querySelector('[data-filter-region]');
    const categorySelect = filterPanel.querySelector('[data-filter-category]');
    const reset = filterPanel.querySelector('[data-filter-reset]');
    const count = filterPanel.querySelector('[data-filter-count]');
    const cards = Array.from(document.querySelectorAll('[data-card]'));
    const params = new URLSearchParams(window.location.search);

    if (input && params.get('q')) {
      input.value = params.get('q');
    }

    const includes = function (source, value) {
      return !value || String(source || '').toLowerCase().includes(String(value || '').toLowerCase());
    };

    const applyFilter = function () {
      const query = input ? input.value.trim().toLowerCase() : '';
      const type = typeSelect ? typeSelect.value : '';
      const region = regionSelect ? regionSelect.value : '';
      const category = categorySelect ? categorySelect.value : '';
      let visible = 0;

      cards.forEach(function (card) {
        const matchesQuery = includes(card.dataset.search, query);
        const matchesType = includes(card.dataset.type, type);
        const matchesRegion = includes(card.dataset.region, region);
        const matchesCategory = includes(card.dataset.category, category);
        const shouldShow = matchesQuery && matchesType && matchesRegion && matchesCategory;

        card.classList.toggle('hidden', !shouldShow);

        if (shouldShow) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '显示 ' + visible + ' / ' + cards.length + ' 部';
      }
    };

    [input, typeSelect, regionSelect, categorySelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    if (reset) {
      reset.addEventListener('click', function () {
        if (input) {
          input.value = '';
        }
        if (typeSelect) {
          typeSelect.value = '';
        }
        if (regionSelect) {
          regionSelect.value = '';
        }
        if (categorySelect) {
          categorySelect.value = '';
        }
        applyFilter();
      });
    }

    applyFilter();
  }

  const playButtons = Array.from(document.querySelectorAll('[data-play-video]'));

  playButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const shell = button.closest('.player-shell');
      const video = shell ? shell.querySelector('video[data-hls-src]') : null;
      const message = shell ? shell.querySelector('[data-player-message]') : null;

      if (!video) {
        return;
      }

      const source = video.dataset.hlsSrc;

      if (!source) {
        if (message) {
          message.textContent = '当前影片未配置播放源。';
        }
        return;
      }

      button.classList.add('hidden');
      video.controls = true;

      const playVideo = function () {
        const promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            if (message) {
              message.textContent = '浏览器阻止了自动播放，请再次点击播放器播放。';
            }
          });
        }
      };

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && message) {
            message.textContent = '播放源加载失败，请刷新页面后重试。';
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
      } else {
        video.src = source;
        if (message) {
          message.textContent = '当前浏览器需要加载 HLS 支持脚本后播放。';
        }
      }
    });
  });
})();
