(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.mobile-nav');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  }

  function setupCardFilter() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-card-filter]'));
    inputs.forEach(function (input) {
      var panel = input.closest('[data-filter-panel]');
      var grid = panel ? panel.parentElement.querySelector('[data-filter-grid]') : document.querySelector('[data-filter-grid]');
      if (!grid) {
        return;
      }
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
      var empty = document.createElement('div');
      empty.className = 'empty-state hidden-by-filter';
      empty.textContent = '没有找到匹配的影片，请更换关键词。';
      grid.parentElement.appendChild(empty);

      function apply() {
        var keyword = normalize(input.value);
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-type'),
            card.getAttribute('data-region'),
            card.getAttribute('data-category'),
            card.getAttribute('data-genre'),
            card.textContent
          ].join(' '));
          var matched = !keyword || haystack.indexOf(keyword) !== -1;
          card.classList.toggle('hidden-by-filter', !matched);
          if (matched) {
            visible += 1;
          }
        });
        empty.classList.toggle('hidden-by-filter', visible !== 0);
      }

      input.addEventListener('input', apply);
      apply();
    });
  }

  function setupSearchPage() {
    var form = document.querySelector('[data-search-form]');
    var input = document.querySelector('[data-search-input]');
    var results = document.getElementById('search-results');
    var stats = document.querySelector('[data-search-stats]');
    if (!form || !input || !results || !stats || !window.MOVIE_SEARCH_DATA) {
      return;
    }

    function cardTemplate(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return [
        '<article class="movie-card">',
        '  <a class="card-link" href="./' + escapeHtml(movie.url) + '" title="' + escapeHtml(movie.title) + ' 在线观看">',
        '    <div class="card-cover">',
        '      <img src="./' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + ' 封面" loading="lazy">',
        '      <span class="play-badge" aria-hidden="true">▶</span>',
        '    </div>',
        '    <div class="card-body">',
        '      <div class="card-meta">',
        '        <span>' + escapeHtml(movie.category) + '</span>',
        '        <span>' + escapeHtml(movie.year) + '</span>',
        '        <span>' + escapeHtml(movie.type) + '</span>',
        '      </div>',
        '      <h3>' + escapeHtml(movie.title) + '</h3>',
        '      <p>' + escapeHtml(movie.oneLine) + '</p>',
        '      <div class="tag-row">' + tags + '</div>',
        '    </div>',
        '  </a>',
        '</article>'
      ].join('');
    }

    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function render() {
      var query = normalize(input.value || new URLSearchParams(window.location.search).get('q') || '');
      if (!input.value && query) {
        input.value = new URLSearchParams(window.location.search).get('q') || '';
      }
      var data = window.MOVIE_SEARCH_DATA;
      var matched = query ? data.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          movie.category,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' '));
        return haystack.indexOf(query) !== -1;
      }) : data.slice(0, 48);
      var limited = matched.slice(0, 120);
      results.innerHTML = limited.map(cardTemplate).join('');
      stats.textContent = query
        ? '找到 ' + matched.length + ' 条结果，当前显示前 ' + limited.length + ' 条。'
        : '默认展示前 48 部影片，输入关键词可搜索全部片库。';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var url = new URL(window.location.href);
      if (input.value) {
        url.searchParams.set('q', input.value);
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url.toString());
      render();
    });
    input.addEventListener('input', render);
    render();
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupCardFilter();
    setupSearchPage();
  });
}());
