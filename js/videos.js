(function () {
  'use strict';

  var fallback = './img/default.jpg';

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function thumb(video) { return video.thumbnailUrl || fallback; }
  function videoUrl(video) { return './watch.html?id=' + encodeURIComponent(video.id); }

  function numberValue(value) {
    var n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function formatViews(value) { return numberValue(value).toLocaleString('ja-JP'); }

  function formatDuration(value) {
    if (value === null || value === undefined || value === '') return '';
    var seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 0) return '';
    seconds = Math.floor(seconds);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
  }

  function dateValue(video) {
    var value = video.createdAt || video.created_at || video.uploadedAt || video.uploaded_at || video.timestamp || video.date;
    if (value == null || value === '') return 0;
    var n = typeof value === 'number' ? value : Date.parse(value);
    if (!Number.isFinite(n)) return 0;
    return n > 0 && n < 100000000000 ? n * 1000 : n;
  }

  function card(video) {
    var href = videoUrl(video);
    var duration = formatDuration(video.duration);
    return '<div class="ytg-box ytg-1col"><div class="video-cell" style="width:99.5%"><div class="video-entry">' +
      '<a href="' + href + '" class="ux-thumb-wrap"><span class="video-thumb ux-thumb-128"><span class="clip"><img title="' + escapeHtml(video.title) + '" alt="サムネイル" src="' + escapeHtml(thumb(video)) + '"></span></span>' +
      (duration ? '<span class="video-time">' + escapeHtml(duration) + '</span>' : '') + '</a>' +
      '<div class="video-main-content video-title-one-line"><div dir="ltr" class="video-title"><div class="video-short-title"><a href="' + href + '" title="' + escapeHtml(video.title) + '">' + escapeHtml(video.title) + '</a></div></div>' +
      '<div class="video-description">' + escapeHtml(video.description || '') + '</div><div class="video-facets"><span class="video-username">作成者: ' + escapeHtml(video.uploader || 'NowTubeユーザー') + '</span> <span class="view-count">再生回数 ' + escapeHtml(formatViews(video.viewCount)) + ' 回</span></div></div><div class="video-clear-list-left"></div></div></div></div>';
  }

  function sidebarItem(video) {
    var duration = formatDuration(video.duration);
    return '<li class="video-list-item"><a href="' + videoUrl(video) + '" class="video-list-item-link"><span class="ux-thumb-wrap"><span class="video-thumb ux-thumb-110"><span class="clip"><img src="' + escapeHtml(thumb(video)) + '" alt="サムネイル"></span></span>' +
      (duration ? '<span class="video-time">' + escapeHtml(duration) + '</span>' : '') +
      '</span><span class="title" title="' + escapeHtml(video.title) + '">' + escapeHtml(video.title) + '</span><span class="stat">ユーザー: ' + escapeHtml(video.uploader || 'NowTubeユーザー') + '</span><span class="stat view-count">再生回数 ' + escapeHtml(formatViews(video.viewCount)) + ' 回</span></a></li>';
  }

  function idKey(video) { return String(video.id); }

  function unique(items, excluded) {
    var seen = new Set(excluded || []);
    var out = [];
    items.forEach(function (video) {
      if (!video || video.id == null) return;
      var id = idKey(video);
      if (seen.has(id)) return;
      seen.add(id);
      out.push(video);
    });
    return out;
  }

  function fillModule(module, items, count) {
    if (!module) return;
    // Replace only the dynamic/static video grid in this module, leaving its heading intact.
    module.querySelectorAll('.grid-view').forEach(function (grid) { grid.remove(); });
    var grid = document.createElement('div');
    grid.className = 'ytg-4col grid-view';
    grid.innerHTML = items.slice(0, count).map(card).join('');
    module.appendChild(grid);
  }

  function loadVideos() {
    fetch('/api/videos', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('動画一覧を取得できません');
        return response.json();
      })
      .then(function (data) {
        var videos = Array.isArray(data.videos) ? data.videos.filter(function (v) { return v && v.id != null; }) : [];
        if (!videos.length) return;

        var newest = videos.slice().sort(function (a, b) {
          return dateValue(b) - dateValue(a);
        });
        var popular = videos.slice().sort(function (a, b) {
          return numberValue(b.viewCount) - numberValue(a.viewCount) || dateValue(b) - dateValue(a);
        });

        // Approximate "話題": prioritize newer videos, while still considering total views.
        var now = Date.now();
        function topicScore(video) {
          var created = dateValue(video);
          var ageDays = created ? Math.max(0, (now - created) / 86400000) : 365;
          return numberValue(video.viewCount) / Math.pow(1 + ageDays / 7, 0.8);
        }
        var topics = videos.slice().sort(function (a, b) {
          return topicScore(b) - topicScore(a) || dateValue(b) - dateValue(a);
        });

        var modules = Array.prototype.slice.call(document.querySelectorAll('#homepage-main-content .top-videos-module'));
        var recommendedModule = null, popularModule = null, topicsModule = null;
        modules.forEach(function (module) {
          var heading = module.querySelector('h2');
          var label = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
          if (label.indexOf('おすすめ') !== -1) recommendedModule = module;
          else if (label.indexOf('人気') !== -1) popularModule = module;
          else if (label.indexOf('話題') !== -1) topicsModule = module;
        });

        // Recommendations: mostly recent uploads with some high-view videos mixed in.
        var recommended = unique(newest.slice(0, 8).concat(popular.slice(0, 12))).slice(0, 12);
        if (recommended.length < Math.min(12, videos.length)) {
          recommended = unique(recommended.concat(newest)).slice(0, 12);
        }

        fillModule(recommendedModule, recommended, 12);
        var used = new Set(recommended.map(idKey));

        var popularItems = unique(popular, used).slice(0, 4);
        fillModule(popularModule, popularItems, 4);
        popularItems.forEach(function (v) { used.add(idKey(v)); });

        var topicItems = unique(topics, used).slice(0, 4);
        fillModule(topicsModule, topicItems, 4);

        var sidebar = document.getElementById('sidebar-videos-PRO');
        if (sidebar) {
          var sideItems = unique(popular, used).slice(0, 5);
          if (sideItems.length < Math.min(5, videos.length)) {
            sideItems = unique(sideItems.concat(popular)).slice(0, 5);
          }
          sidebar.innerHTML = sideItems.map(sidebarItem).join('');
        }
      })
      .catch(function (error) {
        console.warn('NowTube video sections could not be updated:', error);
        // Leave the original HTML cards visible if the API fails.
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadVideos);
  else loadVideos();
})();
