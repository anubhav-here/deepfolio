/* Lazy inline YouTube player. Native video remains visible while playing. */
(() => {
  const root = document.getElementById('motion-portfolio');
  const play = root.querySelector('[data-music-play]');
  const next = root.querySelector('[data-music-next]');
  const shuffle = root.querySelector('[data-music-shuffle]');
  const status = root.querySelector('.mp-music-status');
  const title = root.querySelector('.mp-track a');
  const shell = root.querySelector('.mp-video');
  const playlist = 'PLfbmOEKBzK4Q';
  let player, ready = false, loading = false, shuffled = true, initial = true, timer, guard;
  const report = text => { status.textContent = text; };
  function update() {
    const data = player?.getVideoData?.();
    if (data?.title) title.textContent = data.title;
    play.textContent = player?.getPlayerState?.() === 1 ? 'Pause' : 'Play';
    play.setAttribute('aria-label', play.textContent + ' YouTube playlist');
  }
  function randomTrack() {
    const tracks = player?.getPlaylist?.() || [];
    if (!tracks.length) return false;
    const current = player.getPlaylistIndex();
    const index = tracks.length === 1 ? 0 : (Math.max(0,current) + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length;
    player.playVideoAt(index);
    return true;
  }
  function begin(attempt = 0) {
    if (!initial) return;
    player.setShuffle(shuffled);
    if (player.getPlaylist()?.length) {
      initial = false;
      if (shuffled) randomTrack(); else player.playVideo();
      report(shuffled ? 'Shuffle on' : 'Shuffle off');
    } else if (attempt < 20) {
      timer = setTimeout(() => begin(attempt + 1), 250);
    } else {
      initial = false;
      player.playVideo();
      report('Press play in the player if playback does not start.');
    }
  }
  function create() {
    if (player) return;
    clearTimeout(guard);
    player = new YT.Player('youtube-player', {
      width: '320', height: '200',
      playerVars: {listType: 'playlist', list: playlist, playsinline: 1, rel: 0, controls: 1, origin: location.origin},
      events: {
        onReady: () => { ready = true; loading = false; next.disabled = false; begin(); },
        onStateChange: () => { update(); },
        onAutoplayBlocked: () => { update(); report('Tap Play to start.'); },
        onError: () => { loading = false; update(); report('This track cannot play here. Try Next or open the playlist.'); }
      }
    });
  }
  function load() {
    shell.hidden = false;
    if (loading) return;
    loading = true;
    next.disabled = true;
    report('Loading YouTube…');
    if (window.YT?.Player) { create(); return; }
    window.onYouTubeIframeAPIReady = create;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { loading = false; report('YouTube could not load. Open the playlist above.'); };
    document.head.append(script);
    guard = setTimeout(() => { if (!ready) { loading = false; report('YouTube is taking longer to load. You can open the playlist above.'); } }, 15000);
  }
  play.addEventListener('click', () => {
    if (!ready) { load(); return; }
    if (player.getPlayerState() === 1) player.pauseVideo(); else player.playVideo();
  });
  next.addEventListener('click', () => {
    if (!ready) { load(); return; }
    if (!shuffled || !randomTrack()) player.nextVideo();
  });
  shuffle.addEventListener('click', () => {
    shuffled = !shuffled;
    shuffle.setAttribute('aria-pressed', String(shuffled));
    shuffle.textContent = shuffled ? 'Shuffle on' : 'Shuffle off';
    if (ready) player.setShuffle(shuffled);
    report(shuffled ? 'Shuffle on' : 'Shuffle off');
  });
  addEventListener('pagehide', () => { clearTimeout(timer); clearTimeout(guard); });
})();
