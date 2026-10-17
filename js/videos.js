(function () {
  'use strict';
  var fallback = './img/default.jpg';
  function thumb(video) { return video.thumbnailUrl || fallback; }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }
  function videoUrl(video) { return './watch.html?id=' + encodeURIComponent(video.id); }
  function card(video) {
    var href = videoUrl(video);
    return '<div class="ytg-box ytg-1col"><div class="video-cell" style="width:99.5%"><div class="video-entry">' +
      '<a href="' + href + '" class="ux-thumb-wrap"><span class="video-thumb ux-thumb-128"><span class="clip"><img title="' + escapeHtml(video.title) + '" alt="サムネイル" src="' + escapeHtml(thumb(video)) + '"></span></span><span class="video-time">動画</span></a>' +
      '<div class="video-main-content video-title-one-line"><div dir="ltr" class="video-title"><div class="video-short-title"><a href="' + href + '" title="' + escapeHtml(video.title) + '">' + escapeHtml(video.title) + '</a></div></div>' +
      '<div class="video-description">' + escapeHtml(video.description || '') + '</div><div class="video-facets"><span class="video-username">作成者: ' + escapeHtml(video.uploader || 'NowTubeユーザー') + '</span></div></div><div class="video-clear-list-left"></div></div></div></div>';
  }
  function sidebarItem(video) {
    return '<li class="video-list-item"><a href="' + videoUrl(video) + '" class="video-list-item-link"><span class="ux-thumb-wrap"><span class="video-thumb ux-thumb-110"><span class="clip"><img src="' + escapeHtml(thumb(video)) + '" alt="サムネイル"></span></span></span><span class="title" title="' + escapeHtml(video.title) + '">' + escapeHtml(video.title) + '</span><span class="stat">ユーザー: ' + escapeHtml(video.uploader || 'NowTubeユーザー') + '</span><span class="stat view-count">再生回数 00,000 回</span></a></li>';
  }
  function loadVideos() {
    fetch('/api/videos', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('API unavailable');
      return response.json();
    }).then(function (data) {
      var videos = Array.isArray(data.videos) ? data.videos : [];
      if (!videos.length) return;
      var modules = document.querySelectorAll('#homepage-main-content .top-videos-module');
      if (modules.length) {
        var target = modules[0];
        target.querySelectorAll('.grid-view').forEach(function (node) { node.remove(); });
        var grid = document.createElement('div');
        grid.className = 'ytg-4col grid-view';
        grid.innerHTML = videos.slice(0, 12).map(card).join('');
        target.appendChild(grid);
        for (var i = 1; i < modules.length; i++) {
          var heading = modules[i].querySelector('h2');
          var text = heading ? heading.textContent : '';
          if (text.indexOf('人気') !== -1 || text.indexOf('話題') !== -1) {
            modules[i].querySelectorAll('.grid-view').forEach(function (node) { node.remove(); });
            var extra = document.createElement('div');
            extra.className = 'ytg-4col grid-view';
            extra.innerHTML = videos.slice(0, 4).map(card).join('');
            modules[i].appendChild(extra);
          }
        }
      }
      var sidebar = document.getElementById('sidebar-videos-PRO');
      if (sidebar) sidebar.innerHTML = videos.slice(0, 5).map(sidebarItem).join('');
    }).catch(function () {
      // The static demo cards remain visible if the API has not been configured yet.
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadVideos);
  else loadVideos();
})();
