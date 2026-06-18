(function () {
    function onReady(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function initNavigation() {
        var toggle = document.querySelector("[data-nav-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function initHero() {
        var carousel = document.querySelector("[data-hero-carousel]");
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
        var prev = carousel.querySelector("[data-hero-prev]");
        var next = carousel.querySelector("[data-hero-next]");
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

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }
        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initSearch() {
        var panel = document.querySelector("[data-search-panel]");
        if (!panel) {
            return;
        }
        var keyword = panel.querySelector("[data-filter-keyword]");
        var category = panel.querySelector("[data-filter-category]");
        var year = panel.querySelector("[data-filter-year]");
        var region = panel.querySelector("[data-filter-region]");
        var reset = panel.querySelector("[data-filter-reset]");
        var empty = panel.querySelector("[data-search-empty]");
        var items = Array.prototype.slice.call(panel.querySelectorAll("[data-search-item]"));
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q") || "";
        if (keyword && q) {
            keyword.value = q;
        }

        function apply() {
            var word = keyword ? keyword.value.trim().toLowerCase() : "";
            var cat = category ? category.value : "";
            var yr = year ? year.value : "";
            var reg = region ? region.value : "";
            var visible = 0;
            items.forEach(function (item) {
                var haystack = item.getAttribute("data-search-text") || "";
                var match = true;
                if (word && haystack.indexOf(word) === -1) {
                    match = false;
                }
                if (cat && item.getAttribute("data-category") !== cat) {
                    match = false;
                }
                if (yr && item.getAttribute("data-year") !== yr) {
                    match = false;
                }
                if (reg && item.getAttribute("data-region") !== reg) {
                    match = false;
                }
                item.hidden = !match;
                if (match) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.hidden = visible !== 0;
            }
        }

        [keyword, category, year, region].forEach(function (control) {
            if (!control) {
                return;
            }
            control.addEventListener("input", apply);
            control.addEventListener("change", apply);
        });
        if (reset) {
            reset.addEventListener("click", function () {
                if (keyword) {
                    keyword.value = "";
                }
                if (category) {
                    category.value = "";
                }
                if (year) {
                    year.value = "";
                }
                if (region) {
                    region.value = "";
                }
                apply();
            });
        }
        apply();
    }

    function initPlayers() {
        var wraps = Array.prototype.slice.call(document.querySelectorAll(".movie-player-wrap"));
        wraps.forEach(function (wrap) {
            var video = wrap.querySelector("video.movie-player");
            var cover = wrap.querySelector("[data-play-button]");
            if (!video) {
                return;
            }
            var url = video.getAttribute("data-video") || "";
            var connected = false;
            var hls = null;

            function attach() {
                if (connected || !url) {
                    return;
                }
                connected = true;
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = url;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({ enableWorker: true });
                    hls.loadSource(url);
                    hls.attachMedia(video);
                } else {
                    video.src = url;
                }
            }

            function play() {
                attach();
                if (cover) {
                    cover.classList.add("is-hidden");
                }
                video.setAttribute("controls", "controls");
                var attempt = video.play();
                if (attempt && attempt.catch) {
                    attempt.catch(function () {});
                }
            }

            if (cover) {
                cover.addEventListener("click", play);
            }
            video.addEventListener("click", function () {
                if (!connected) {
                    play();
                }
            });
            window.addEventListener("pagehide", function () {
                if (hls && hls.destroy) {
                    hls.destroy();
                }
            });
        });
    }

    onReady(function () {
        initNavigation();
        initHero();
        initSearch();
        initPlayers();
    });
})();
