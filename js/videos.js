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

  function formatDuration(seconds) {
    seconds = Number(seconds);
    if (!Number.isFinite(seconds) || seconds < 0) return '';
    seconds = Math.floor(seconds);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
  }

  function formatViews(count) {
    count = Number(count);
    return Number.isFinite(count) && count >= 0 ? count.toLocaleString('ja-JP') : '0';
  }

  function card(video) {
    var href = videoUrl(video);
    var duration = formatDuration(video.duration);
    return '<div class="ytg-box ytg-1col"><div class="video-cell" style="width:99.5%"><div class="video-entry">' +
      '<a href="' + href + '" class="ux-thumb-wrap"><span class="video-thumb ux-thumb-128"><span class="clip"><img title="' + escapeHtml(video.title) + '" alt="サムネイル" src="' + escapeHtml(thumb(video)) + '"></span></span><span class="video-time">' + escapeHtml(duration) + '</span></a>' +
      '<div class="video-main-content video-title-one-line"><div dir="ltr" class="video-title"><div class="video-short-title"><a href="' + href + '" title="' + escapeHtml(video.title) + '">' + escapeHtml(video.title) + '</a></div></div>' +
      '<div class="video-description">' + escapeHtml(video.description || '') + '</div><div class="video-facets"><span class="video-username">作成者: ' + escapeHtml(video.uploader || 'NowTubeユーザー') + '</span> <span class="view-count">再生回数 ' + escapeHtml(formatViews(video.viewCount)) + ' 回</span></div></div><div class="video-clear-list-left"></div></div></div></div>';
  }

  function sidebarItem(video) {
    var duration = formatDuration(video.duration);
    return '<li class="video-list-item"><a href="' + videoUrl(video) + '" class="video-list-item-link"><span class="ux-thumb-wrap"><span class="video-thumb ux-thumb-110"><span class="clip"><img src="' + escapeHtml(thumb(video)) + '" alt="サムネイル"></span></span>' +
      (duration ? '<span class="video-time">' + escapeHtml(duration) + '</span>' : '') +
      '</span><span class="title" title="' + escapeHtml(video.title) + '">' + escapeHtml(video.title) + '</span><span class="stat">ユーザー: ' + escapeHtml(video.uploader || 'NowTubeユーザー') + '</span><span class="stat view-count">再生回数 ' + escapeHtml(formatViews(video.viewCount)) + ' 回</span></a></li>';
  }

  function views(video) {
    var n = Number(video.viewCount);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function dateValue(video) {
    var value = video.createdAt || video.created_at || video.uploadedAt || video.uploaded_at || video.timestamp || video.date;
    if (value == null) return 0;
    var n = typeof value === 'number' ? value : Date.parse(value);
    if (!Number.isFinite(n)) return 0;
    // Support Unix timestamps expressed in seconds.
    return n > 0 && n < 100000000000 ? n * 1000 : n;
  }

  function uniqueById(items, excludeIds) {
    var seen = new Set(excludeIds || []);
    return items.filter(function (video) {
      var key = String(video.id);
      if (!video || video.id == null || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function pick(items, count, excludeIds) {
    return uniqueById(items, excludeIds).slice(0, count);
  }

  function renderGrid(module, items, count) {
    if (!module) return;
    module.querySelectorAll('.grid-view').forEach(function (node) { node.remove(); });
    var grid = document.createElement('div');
    grid.className = 'ytg-4col grid-view';
    grid.innerHTML = items.slice(0, count).map(card).join('');
    module.appendChild(grid);
  }

  function loadVideos() {
    fetch('/api/videos', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('API unavailable');
      return response.json();
    }).then(function (data) {
      var videos = Array.isArray(data.videos) ? data.videos.slice() : [];
      if (!videos.length) return;

      var newest = videos.slice().sort(function (a, b) {
        return dateValue(b) - dateValue(a);
      });

      var popular = videos.slice().sort(function (a, b) {
        return views(b) - views(a) || dateValue(b) - dateValue(a);
      });

      // "話題" is a lightweight approximation: views weighted toward recent uploads.
      // It does not claim to measure actual views gained in the last 24 hours.
      var now = Date.now();
      function buzzScore(video) {
        var ageDays = dateValue(video) ? Math.max(0, (now - dateValue(video)) / 86400000) : 365;
        return views(video) / Math.pow(1 + ageDays / 7, 0.8);
      }
      var trending = videos.slice().sort(function (a, b) {
        return buzzScore(b) - buzzScore(a) || dateValue(b) - dateValue(a);
      });

      var modules = document.querySelectorAll('#homepage-main-content .top-videos-module');
      var used = new Set();

      if (modules.length) {
        // Main recommendation: mostly recent uploads, with some popular videos mixed in.
        var recommendations = [];
        var recentCount = Math.min(8, Math.ceil(Math.min(12, videos.length) * 2 / 3));
        recommendations = recommendations.concat(newest.slice(0, recentCount));
        recommendations = recommendations.concat(popular.slice(0, 12));
        recommendations = uniqueById(recommendations).slice(0, 12);
        if (recommendations.length < Math.min(12, videos.length)) {
          recommendations = uniqueById(recommendations.concat(videos));
        }

        renderGrid(modules[0], recommendations, 12);
        recommendations.forEach(function (v) { used.add(String(v.id)); });

        for (var i = 1; i < modules.length; i++) {
          var heading = modules[i].querySelector('h2');
          var label = heading ? heading.textContent : '';
          var selected;

          if (label.indexOf('人気') !== -1) {
            selected = pick(popular, 4, used);
          } else if (label.indexOf('話題') !== -1) {
            selected = pick(trending, 4, used);
          } else {
            continue;
          }

          renderGrid(modules[i], selected, 4);
          selected.forEach(function (v) { used.add(String(v.id)); });
        }
      }

      var sidebar = document.getElementById('sidebar-videos-PRO');
      if (sidebar) {
        // Sidebar is a popular-video shortlist, avoiding items already featured where possible.
        var sideItems = pick(popular, 5, used);
        if (sideItems.length < 5) sideItems = uniqueById(sideItems.concat(popular)).slice(0, 5);
        sidebar.innerHTML = sideItems.map(sidebarItem).join('');
      }
    }).catch(function () {
      // Static demo cards remain visible if the API is not configured.
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadVideos);
  else loadVideos();
})();
