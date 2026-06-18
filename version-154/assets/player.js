(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function initPlayer(wrapper) {
    var video = wrapper.querySelector('video[data-src]');
    var message = wrapper.querySelector('[data-player-message]');
    var playButtons = Array.prototype.slice.call(wrapper.querySelectorAll('[data-play-toggle]'));
    var muteButton = wrapper.querySelector('[data-mute-toggle]');
    var fullscreenButton = wrapper.querySelector('[data-fullscreen-toggle]');
    if (!video) {
      return;
    }

    var source = video.getAttribute('data-src');
    var hlsInstance = null;

    function setMessage(text) {
      if (message) {
        message.textContent = text;
      }
    }

    function attachSource() {
      if (!source || video.dataset.sourceReady === '1') {
        return;
      }
      video.dataset.sourceReady = '1';
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setMessage('片源已加载，可继续播放');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage('片源加载失败，请稍后重试');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setMessage('片源已加载，可继续播放');
      } else {
        setMessage('当前浏览器需要 HLS 支持才能播放');
      }
    }

    function togglePlay() {
      attachSource();
      if (video.paused) {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            setMessage('浏览器阻止自动播放，请再次点击播放');
          });
        }
      } else {
        video.pause();
      }
    }

    playButtons.forEach(function (button) {
      button.addEventListener('click', togglePlay);
    });
    video.addEventListener('click', togglePlay);
    video.addEventListener('play', function () {
      wrapper.classList.add('playing');
      setMessage('正在播放');
    });
    video.addEventListener('pause', function () {
      wrapper.classList.remove('playing');
      setMessage('已暂停，点击继续播放');
    });
    video.addEventListener('ended', function () {
      wrapper.classList.remove('playing');
      setMessage('播放结束');
    });

    if (muteButton) {
      muteButton.addEventListener('click', function () {
        video.muted = !video.muted;
        muteButton.textContent = video.muted ? '取消静音' : '静音';
      });
    }

    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', function () {
        var target = wrapper.querySelector('.video-wrap') || video;
        if (target.requestFullscreen) {
          target.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(initPlayer);
  });
}());
