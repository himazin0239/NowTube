(function () {
  'use strict';
  var list = document.getElementById('mobile-video-list');
  var status = document.getElementById('mobile-status');
  if (!list) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  fetch('/api/videos', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (data) {
    var videos = Array.isArray(data.videos) ? data.videos : [];
    if (!videos.length) { if (status) status.textContent = 'まだ投稿された動画はありません。'; return; }
    list.innerHTML = videos.map(function (v) {
      return '<div class="mobile-video"><table width="100%" cellspacing="0"><tr valign="top"><td width="80" style="font-size:0"><a href="./watch.html?id=' + encodeURIComponent(v.id) + '"><img src="./img/default.jpg" alt="サムネイル" width="80" height="60" style="border:0"></a></td><td style="font-size:13px;padding-left:2px"><div style="font-size:90%;padding-bottom:1px"><a href="./watch.html?id=' + encodeURIComponent(v.id) + '">' + esc(v.title) + '</a></div><div style="font-size:80%">動画</div><div style="font-size:80%">投稿者: ' + esc(v.uploader || 'NowTubeユーザー') + '</div><div style="font-size:80%">再生回数 00,000回</div><div style="font-size:90%;margin-top:5px">' + esc(v.description || '') + '</div></td></tr></table></div><hr style="width:100%;height:1px;margin:2px 0;padding:0;background:#999;border:0">';
    }).join('');
    if (status) status.textContent = '';
  }).catch(function () { if (status) status.textContent = '動画一覧を読み込めません。Vercel Blobの設定後に表示されます。'; });
})();
