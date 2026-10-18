(function(){
fetch('/api/me',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
 if(!d.user)return;
 var nav=document.getElementById('nav');if(!nav)return;
 var link=document.getElementById('my-channel-link');
 if(link){link.href='./channel.html?user='+encodeURIComponent(d.user.username);link.textContent='マイチャンネル';}
}).catch(function(){});
})();