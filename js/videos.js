(function () {
  'use strict';
  var fallback = './img/default.jpg';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);}); }
  function url(v) { return './watch.html?id=' + encodeURIComponent(v.id); }
  function image(v) { return v.thumbnailUrl || v.thumbnail || fallback; }
  function views(v) { var n=Number(v.viewCount); return Number.isFinite(n)&&n>0?n:0; }
  function date(v) {
    var x=v.createdAt||v.created_at||v.uploadedAt||v.uploaded_at||v.timestamp||v.date;
    if (x == null) return 0;
    var n=typeof x==='number'?x:Date.parse(x);
    if (!Number.isFinite(n)) return 0;
    return n>0&&n<100000000000?n*1000:n;
  }
  function duration(v) {
    var n=Number(v.duration); if(!Number.isFinite(n)||n<0)return '';
    n=Math.floor(n); var h=Math.floor(n/3600),m=Math.floor((n%3600)/60),s=n%60;
    return h ? h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0') : m+':'+String(s).padStart(2,'0');
  }
  function card(v) {
    var d=duration(v), href=url(v);
    return '<div class="ytg-box ytg-1col"><div class="video-cell" style="width:99.5%"><div class="video-entry">'+
      '<a href="'+href+'" class="ux-thumb-wrap"><span class="video-thumb ux-thumb-128"><span class="clip"><img title="'+esc(v.title)+'" alt="サムネイル" src="'+esc(image(v))+'"></span></span>'+(d?'<span class="video-time">'+esc(d)+'</span>':'')+'</a>'+
      '<div class="video-main-content video-title-one-line"><div dir="ltr" class="video-title"><div class="video-short-title"><a href="'+href+'" title="'+esc(v.title)+'">'+esc(v.title)+'</a></div></div>'+
      '<div class="video-description">'+esc(v.description||'')+'</div><div class="video-facets"><span class="video-username">作成者: '+esc(v.uploader||'NowTubeユーザー')+'</span> <span class="view-count">再生回数 '+views(v).toLocaleString('ja-JP')+' 回</span></div></div><div class="video-clear-list-left"></div></div></div></div>';
  }
  function sidebarItem(v) {
    var d=duration(v), href=url(v);
    return '<li class="video-list-item"><a href="'+href+'" class="video-list-item-link"><span class="ux-thumb-wrap"><span class="video-thumb ux-thumb-110"><span class="clip"><img src="'+esc(image(v))+'" alt="サムネイル"></span></span>'+(d?'<span class="video-time">'+esc(d)+'</span>':'')+'</span><span class="title" title="'+esc(v.title)+'">'+esc(v.title)+'</span><span class="stat">ユーザー: '+esc(v.uploader||'NowTubeユーザー')+'</span><span class="stat view-count">再生回数 '+views(v).toLocaleString('ja-JP')+' 回</span></a></li>';
  }
  function uniq(list, excluded) {
    var seen=new Set(excluded||[]);
    return list.filter(function(v){if(!v||v.id==null||seen.has(String(v.id)))return false;seen.add(String(v.id));return true;});
  }
  function put(module, list, count) {
    if(!module)return;
    // Replace the existing static sample grid rather than appending a second grid.
    var grids=module.querySelectorAll('.ytg-4col.grid-view');
    var grid=grids[0];
    if(!grid){grid=document.createElement('div');grid.className='ytg-4col grid-view';module.appendChild(grid);}
    for(var i=1;i<grids.length;i++)grids[i].remove();
    grid.innerHTML=list.slice(0,count).map(card).join('');
  }
  function load() {
    fetch('/api/videos',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('API');return r.json();}).then(function(data){
      var videos=Array.isArray(data.videos)?data.videos.slice():[];
      if(!videos.length)return;
      var newest=videos.slice().sort(function(a,b){return date(b)-date(a);});
      var popular=videos.slice().sort(function(a,b){return views(b)-views(a)||date(b)-date(a);});
      var now=Date.now();
      function buzz(v){var dt=date(v),age=dt?Math.max(0,(now-dt)/86400000):365;return views(v)/Math.pow(1+age/7,.8);}
      var trending=videos.slice().sort(function(a,b){return buzz(b)-buzz(a)||date(b)-date(a);});
      var modules=Array.from(document.querySelectorAll('.top-videos-module'));
      var used=new Set();
      modules.forEach(function(m){
        var h=m.querySelector('h2');
        var label=h?(h.textContent||'').trim():'';
        var selected;
        if(label.indexOf('おすすめ')!==-1){
          // Recent uploads first, then popular videos, without duplicates.
          selected=uniq(newest.slice(0,8).concat(popular)).slice(0,12);
        } else if(label.indexOf('人気')!==-1) {
          selected=uniq(popular,used).slice(0,4);
        } else if(label.indexOf('話題')!==-1) {
          selected=uniq(trending,used).slice(0,4);
        } else return;
        put(m,selected,label.indexOf('おすすめ')!==-1?12:4);
        selected.forEach(function(v){used.add(String(v.id));});
      });
      var side=document.getElementById('sidebar-videos-PRO');
      if(side){var sideItems=uniq(popular,used).slice(0,5);if(sideItems.length<5)sideItems=uniq(sideItems.concat(popular)).slice(0,5);side.innerHTML=sideItems.map(sidebarItem).join('');}
    }).catch(function(e){console.warn('NowTube videos could not load',e);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
