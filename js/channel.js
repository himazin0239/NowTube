(function(){
'use strict';
var params=new URLSearchParams(location.search);
var username=params.get('user');
var $=function(id){return document.getElementById(id);};
var state=null;
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
function views(v){var n=Number(v);return (Number.isFinite(n)&&n>=0?n:0).toLocaleString('ja-JP');}
function duration(v){var n=Number(v);if(!Number.isFinite(n)||n<0)return '';n=Math.floor(n);var h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0');}
function showMessage(text,isError){$('message').hidden=false;$('message').textContent=text;$('message').style.color=isError?'#900':'#444';}
function render(){
 var c=state.channel;
 $('channel-name').textContent=c.username+' のチャンネル';
 $('subscriber-count').textContent=views(state.subscriberCount);
 $('video-count').textContent=views(state.videoCount);
 $('description').textContent=c.description||'このチャンネルにはまだ説明がありません。';
 $('channel-content').hidden=false;$('message').hidden=true;
 $('subscribe-button').hidden=state.isOwner;
 $('edit-button').hidden=!state.isOwner;
 $('action-note').textContent=state.isOwner?'自分のチャンネルです。':(!state.isLoggedIn?'チャンネル登録にはログインが必要です。':'');
 $('subscribe-button').textContent=state.isSubscribed?'チャンネル登録解除':'チャンネル登録';
 var list=$('videos');
 if(!state.videos.length){list.innerHTML='<div class="empty">このチャンネルにはまだ動画がありません。</div>';return;}
 list.innerHTML=state.videos.map(function(v){
  var img=v.thumbnailUrl||'./img/default.jpg';
  return '<article class="video-card"><a href="./watch.html?id='+encodeURIComponent(v.id)+'"><img src="'+esc(img)+'" alt="" loading="lazy" onerror="this.src=\\'./img/default.jpg\\'"></a><a class="v-title" href="./watch.html?id='+encodeURIComponent(v.id)+'">'+esc(v.title)+'</a><div class="v-meta">'+views(v.viewCount)+' 回再生'+(duration(v.duration)?' ・ '+esc(duration(v.duration)):'')+'</div></article>';
 }).join('');
}
async function load(){
 try{
  if(!username){
   var me=await fetch('/api/me',{cache:'no-store'}).then(function(r){return r.json();});
   if(!me.user){location.href='./login.html?next='+encodeURIComponent('./channel.html');return;}
   username=me.user.username;
   history.replaceState(null,'','./channel.html?user='+encodeURIComponent(username));
  }
  var r=await fetch('/api/channel?username='+encodeURIComponent(username),{cache:'no-store'});
  var d=await r.json();if(!r.ok)throw new Error(d.error||'チャンネルを読み込めません。');
  state=d;render();
 }catch(e){showMessage(e.message||'チャンネルを読み込めませんでした。',true);}
}
$('subscribe-button').addEventListener('click',async function(){
 if(!state)return;
 if(!state.isLoggedIn){location.href='./login.html?next='+encodeURIComponent(location.pathname+location.search);return;}
 var b=$('subscribe-button');b.disabled=true;
 try{
  var r=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:state.channel.username})});
  var d=await r.json();if(r.status===401){location.href='./login.html?next='+encodeURIComponent(location.pathname+location.search);return;}
  if(!r.ok)throw new Error(d.error||'チャンネル登録を変更できませんでした。');
  state.isSubscribed=d.isSubscribed;state.subscriberCount=d.subscriberCount;render();
 }catch(e){$('action-note').textContent=e.message;}finally{b.disabled=false;}
});
$('edit-button').addEventListener('click',function(){$('description-editor').value=state.channel.description||'';$('editor-wrap').hidden=false;$('description').hidden=true;$('edit-button').hidden=true;});
$('cancel-description').addEventListener('click',function(){$('editor-wrap').hidden=true;$('description').hidden=false;$('edit-button').hidden=false;});
$('save-description').addEventListener('click',async function(){
 var b=$('save-description');b.disabled=true;
 try{
  var r=await fetch('/api/channel-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:$('description-editor').value})});
  var d=await r.json();if(!r.ok)throw new Error(d.error||'保存に失敗しました。');
  state.channel.description=d.description;$('description').textContent=d.description||'このチャンネルにはまだ説明がありません。';$('editor-wrap').hidden=true;$('description').hidden=false;$('edit-button').hidden=false;$('action-note').textContent='チャンネル説明を保存しました。';
 }catch(e){$('action-note').textContent=e.message;}finally{b.disabled=false;}
});
load();
})();