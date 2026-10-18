(function () {
  'use strict';
  var fallback = './img/default.jpg';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function views(v){var n=Number(v.viewCount);return Number.isFinite(n)&&n>=0?n:0;}
  function date(v){var x=v.createdAt||v.created_at||v.uploadedAt||v.uploaded_at||v.timestamp||v.date;if(x==null)return 0;var n=typeof x==='number'?x:Date.parse(x);if(!Number.isFinite(n))return 0;return n>0&&n<1e11?n*1000:n;}
  function duration(v){var n=Number(v.duration);if(!Number.isFinite(n)||n<0)return '';n=Math.floor(n);var h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0');}
  function href(v){return './watch.html?id='+encodeURIComponent(v.id);}
  function card(v){var d=duration(v),img=v.thumbnailUrl||v.thumbnail||fallback;return '<div class="ytg-box ytg-1col"><div class="video-cell" style="width:99.5%"><div class="video-entry"><a href="'+href(v)+'" class="ux-thumb-wrap"><span class="video-thumb ux-thumb-128"><span class="clip"><img title="'+esc(v.title)+'" alt="サムネイル" src="'+esc(img)+'"></span></span>'+(d?'<span class="video-time">'+esc(d)+'</span>':'')+'</a><div class="video-main-content video-title-one-line"><div dir="ltr" class="video-title"><div class="video-short-title"><a href="'+href(v)+'" title="'+esc(v.title)+'">'+esc(v.title||'無題の動画')+'</a></div></div><div class="video-description">'+esc(v.description||'')+'</div><div class="video-facets"><span class="video-username">作成者: '+esc(v.uploader||'NowTubeユーザー')+'</span> <span class="view-count">再生回数 '+views(v).toLocaleString('ja-JP')+' 回</span></div></div><div class="video-clear-list-left"></div></div></div></div>';}
  function sidebar(v){var d=duration(v),img=v.thumbnailUrl||v.thumbnail||fallback;return '<li class="video-list-item"><a href="'+href(v)+'" class="video-list-item-link"><span class="ux-thumb-wrap"><span class="video-thumb ux-thumb-110"><span class="clip"><img src="'+esc(img)+'" alt="サムネイル"></span></span>'+(d?'<span class="video-time">'+esc(d)+'</span>':'')+'</span><span class="title">'+esc(v.title||'無題の動画')+'</span><span class="stat">ユーザー: '+esc(v.uploader||'NowTubeユーザー')+'</span><span class="stat view-count">再生回数 '+views(v).toLocaleString('ja-JP')+' 回</span></a></li>';}
  function unique(list){var seen=new Set();return list.filter(function(v){if(!v||v.id==null||seen.has(String(v.id)))return false;seen.add(String(v.id));return true;});}
  function fill(module,list,limit){var grid=module.querySelector('.ytg-4col.grid-view');if(!grid){grid=document.createElement('div');grid.className='ytg-4col grid-view';module.appendChild(grid);}grid.innerHTML=list.slice(0,limit).map(card).join('');}
  function load(){
    fetch('/api/videos',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('API error '+r.status);return r.json();}).then(function(data){
      var videos=Array.isArray(data.videos)?data.videos:[];if(!videos.length)return;
      var newest=videos.slice().sort(function(a,b){return date(b)-date(a);});
      var popular=videos.slice().sort(function(a,b){return views(b)-views(a)||date(b)-date(a);});
      var now=Date.now();function score(v){var d=date(v),age=d?Math.max(0,(now-d)/86400000):365;return views(v)/Math.pow(1+age/7,.8);}
      var trending=videos.slice().sort(function(a,b){return score(b)-score(a)||date(b)-date(a);});
      // Do not rely on a page wrapper ID: the current HTML has modules outside that wrapper.
      var modules=Array.prototype.slice.call(document.querySelectorAll('.top-videos-module'));
      modules.forEach(function(module){
        var heading=module.querySelector('h2');
        var label=heading?(heading.textContent||'').replace(/\s+/g,' ').trim():'';
        if(label.indexOf('おすすめ')!==-1){
          fill(module,unique(newest.slice(0,8).concat(popular)),12);
        }else if(label.indexOf('人気')!==-1){
          fill(module,popular,4);
        }else if(label.indexOf('話題')!==-1){
          fill(module,trending,4);
        }
      });
      var side=document.getElementById('sidebar-videos-PRO');if(side)side.innerHTML=popular.slice(0,5).map(sidebar).join('');
    }).catch(function(err){console.error('NowTube動画一覧の読み込みに失敗:',err);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();