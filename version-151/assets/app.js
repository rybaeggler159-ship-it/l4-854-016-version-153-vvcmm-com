(function () {
    var mobileButton = document.querySelector('[data-mobile-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (mobileButton && mobileNav) {
        mobileButton.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    var backTop = document.querySelector('[data-back-top]');

    if (backTop) {
        window.addEventListener('scroll', function () {
            backTop.classList.toggle('is-visible', window.scrollY > 520);
        });

        backTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var currentSlide = 0;

    function setSlide(index) {
        if (!slides.length) {
            return;
        }

        currentSlide = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('is-active', slideIndex === currentSlide);
        });

        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('is-active', dotIndex === currentSlide);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            setSlide(index);
        });
    });

    if (slides.length > 1) {
        setInterval(function () {
            setSlide(currentSlide + 1);
        }, 5200);
    }

    setSlide(0);

    var searchForm = document.querySelector('[data-filter-form]');

    if (searchForm) {
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
        var emptyState = document.querySelector('[data-empty-state]');
        var queryInput = searchForm.querySelector('[name="q"]');
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q');

        if (initialQuery && queryInput) {
            queryInput.value = initialQuery;
        }

        function cardMatches(card, filters) {
            var text = [
                card.getAttribute('data-title'),
                card.getAttribute('data-tags'),
                card.getAttribute('data-genre'),
                card.getAttribute('data-region'),
                card.getAttribute('data-type')
            ].join(' ').toLowerCase();

            if (filters.q && text.indexOf(filters.q) === -1) {
                return false;
            }

            if (filters.category && card.getAttribute('data-category') !== filters.category) {
                return false;
            }

            if (filters.region && card.getAttribute('data-region-group') !== filters.region) {
                return false;
            }

            if (filters.type && card.getAttribute('data-type-group') !== filters.type) {
                return false;
            }

            if (filters.year && card.getAttribute('data-year') !== filters.year) {
                return false;
            }

            return true;
        }

        function applyFilters() {
            var data = new FormData(searchForm);
            var filters = {
                q: String(data.get('q') || '').trim().toLowerCase(),
                category: String(data.get('category') || ''),
                region: String(data.get('region') || ''),
                type: String(data.get('type') || ''),
                year: String(data.get('year') || '')
            };
            var visible = 0;

            cards.forEach(function (card) {
                var matched = cardMatches(card, filters);
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    visible += 1;
                }
            });

            if (emptyState) {
                emptyState.classList.toggle('is-visible', visible === 0);
            }
        }

        searchForm.addEventListener('input', applyFilters);
        searchForm.addEventListener('change', applyFilters);
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            applyFilters();
        });
        applyFilters();
    }

    function bindVideo(video) {
        var source = video.getAttribute('data-play');

        if (!source || video.getAttribute('src')) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            video._hls = hls;
            return;
        }

        video.src = source;
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (player) {
        var video = player.querySelector('video');
        var trigger = player.querySelector('[data-play-trigger]');

        if (!video || !trigger) {
            return;
        }

        function startPlayback() {
            bindVideo(video);
            player.classList.add('is-playing');
            video.setAttribute('controls', 'controls');

            var attempt = video.play();

            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () {
                    player.classList.remove('is-playing');
                });
            }
        }

        trigger.addEventListener('click', startPlayback);
        video.addEventListener('click', function () {
            if (!video.getAttribute('src')) {
                startPlayback();
            }
        });
        video.addEventListener('play', function () {
            player.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
            if (!video.ended) {
                player.classList.remove('is-playing');
            }
        });
    });
})();
