(function () {
  'use strict';
  var params = new URLSearchParams(window.location.search);
  var query = (params.get('search_query') || params.get('q') || '').trim();
  var input = document.getElementById('nt-search-input');
  var mastheadInput = document.getElementById('masthead-search-term');
  var heading = document.getElementById('nt-search-heading');
  var meta = document.getElementById('nt-search-meta');
  var results = document.getElementById('nt-search-results');
  if (input) input.value = query;
  if (mastheadInput) mastheadInput.value = query;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function videoUrl(v) { return './watch.html?id=' + encodeURIComponent(v.id); }
  function channelUrl(v) { return './channel.html?user=' + encodeURIComponent(v.uploader || ''); }
  function formatDate(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ja-JP');
  }
  function render(videos) {
    if (!videos.length) {
      results.innerHTML = '<div class="nt-search-state">該当する動画が見つかりませんでした。<br>別のキーワードでもう一度検索してみてください。</div>';
      return;
    }
    results.innerHTML = videos.map(function (v) {
      var thumb = v.thumbnailUrl || './img/default.jpg';
      return '<article class="nt-search-row">' +
        '<a class="nt-search-thumb" href="' + videoUrl(v) + '"><img loading="lazy" src="' + esc(thumb) + '" alt="サムネイル"></a>' +
        '<div class="nt-search-info"><a class="nt-search-title" href="' + videoUrl(v) + '">' + esc(v.title || 'タイトルなし') + '</a>' +
        '<div class="nt-search-description">' + esc((v.description || '').slice(0, 320)) + '</div>' +
        '<div class="nt-search-stats"><a class="nt-search-uploader" href="' + channelUrl(v) + '">ユーザー: ' + esc(v.uploader || 'NowTubeユーザー') + '</a>' +
        ' ・ 再生回数 ' + esc(Number(v.viewCount || 0).toLocaleString('ja-JP')) + ' 回' +
        (formatDate(v.createdAt) ? ' ・ ' + esc(formatDate(v.createdAt)) : '') + '</div></div></article>';
    }).join('');
  }
  if (!query) {
    heading.textContent = '動画を検索';
    meta.textContent = 'キーワードを入力して、NowTubeの動画を検索できます。';
    results.innerHTML = '<div class="nt-search-state">検索キーワードを入力してください。</div>';
    return;
  }
  heading.textContent = '「' + query + '」の検索結果';
  results.innerHTML = '<div class="nt-search-state">動画を検索しています...</div>';
  fetch('/api/videos', { cache: 'no-store' }).then(function (response) {
    if (!response.ok) throw new Error('動画一覧を取得できませんでした。');
    return response.json();
  }).then(function (data) {
    var videos = Array.isArray(data.videos) ? data.videos : [];
    var terms = query.toLocaleLowerCase('ja-JP').split(/\s+/).filter(Boolean);
    var matched = videos.filter(function (v) {
      var haystack = [v.title, v.description, v.uploader].join(' ').toLocaleLowerCase('ja-JP');
      return terms.every(function (term) { return haystack.indexOf(term) !== -1; });
    });
    matched.sort(function (a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
    meta.textContent = '検索結果: ' + matched.length + ' 本';
    render(matched);
  }).catch(function (error) {
    meta.textContent = '';
    results.innerHTML = '<div class="nt-search-state">検索に失敗しました。時間をおいて再読み込みしてください。<br><small>' + esc(error.message) + '</small></div>';
  });
})();
