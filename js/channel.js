(() => {
  const $ = (id) => document.getElementById(id);
  const message = $('message');
  const content = $('channel-content');

  function showMessage(text, isError = false) {
    if (!message) return;
    message.hidden = false;
    message.textContent = text;
    message.style.color = isError ? '#b00020' : '#444';
  }

  async function requestJSON(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `通信エラー (${response.status})`);
    }
    return data;
  }

  function makeVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';

    const link = document.createElement('a');
    // Use the site's existing watch page if it exists.
    link.href = `./watch.html?v=${encodeURIComponent(video.id)}`;

    const img = document.createElement('img');
    img.src = video.thumbnailUrl || './img/default-thumbnail.jpg';
    img.alt = '';
    img.loading = 'lazy';
    img.onerror = () => { img.style.display = 'none'; };
    link.appendChild(img);

    const title = document.createElement('span');
    title.className = 'v-title';
    title.textContent = video.title || 'タイトルなし';
    link.appendChild(title);
    card.appendChild(link);

    const meta = document.createElement('div');
    meta.className = 'v-meta';
    const views = Number(video.viewCount || 0).toLocaleString('ja-JP');
    const date = video.createdAt ? new Date(video.createdAt) : null;
    const dateText = date && !Number.isNaN(date.getTime())
      ? ` ・ ${date.toLocaleDateString('ja-JP')}` : '';
    meta.textContent = `再生回数 ${views} 回${dateText}`;
    card.appendChild(meta);
    return card;
  }

  function showEmpty(container, text) {
    const el = document.createElement('div');
    el.className = 'empty';
    el.textContent = text;
    container.replaceChildren(el);
  }

  async function main() {
    try {
      const params = new URLSearchParams(location.search);
      let username = (params.get('user') || params.get('username') || '').trim();

      // No username in the URL means "my channel".
      if (!username) {
        let me;
        try {
          me = await requestJSON('/api/me');
        } catch (error) {
          if (error.message) throw error;
          throw new Error('ログイン状態を確認できませんでした。');
        }
        const currentUser = me.user || me;
        username = String(currentUser.username || '').trim();
        if (!username) {
          location.href = './login.html';
          return;
        }
        history.replaceState(null, '', `./channel.html?user=${encodeURIComponent(username)}`);
      }

      const data = await requestJSON(`/api/channel?username=${encodeURIComponent(username)}`);
      const channel = data.channel;
      if (!channel) throw new Error('チャンネル情報が見つかりませんでした。');

      $('channel-name').textContent = channel.username || username;
      document.title = `${channel.username || username} のチャンネル - NowTube`;
      $('subscriber-count').textContent = Number(data.subscriberCount || 0).toLocaleString('ja-JP');
      $('video-count').textContent = Number(data.videoCount || 0).toLocaleString('ja-JP');

      const description = $('description');
      description.textContent = channel.description || '';
      if (!channel.description) {
        description.textContent = data.isOwner
          ? 'まだチャンネルの説明がありません。説明を追加してみよう！'
          : 'このチャンネルにはまだ説明がありません。';
      }

      const editButton = $('edit-button');
      const editorWrap = $('editor-wrap');
      const editor = $('description-editor');
      const saveButton = $('save-description');
      const cancelButton = $('cancel-description');
      const actionNote = $('action-note');

      if (data.isOwner) {
        editButton.hidden = false;
        editButton.addEventListener('click', () => {
          editor.value = channel.description || '';
          editorWrap.hidden = false;
          description.hidden = true;
          editButton.hidden = true;
          actionNote.textContent = '';
          editor.focus();
        });

        cancelButton.addEventListener('click', () => {
          editorWrap.hidden = true;
          description.hidden = false;
          editButton.hidden = false;
          actionNote.textContent = '';
        });

        saveButton.addEventListener('click', async () => {
          saveButton.disabled = true;
          actionNote.textContent = '保存しています…';
          try {
            const updated = await requestJSON('/api/channel-update', {
              method: 'POST',
              body: JSON.stringify({ description: editor.value })
            });
            channel.description = updated.description ?? updated.channel?.description ?? editor.value;
            description.textContent = channel.description || 'まだチャンネルの説明がありません。';
            editorWrap.hidden = true;
            description.hidden = false;
            editButton.hidden = false;
            actionNote.textContent = '説明を保存しました。';
          } catch (error) {
            actionNote.textContent = error.message || '保存できませんでした。';
          } finally {
            saveButton.disabled = false;
          }
        });
      }

      const subscribeButton = $('subscribe-button');
      if (data.isLoggedIn && !data.isOwner) {
        subscribeButton.hidden = false;
        const updateSubscribeLabel = () => {
          subscribeButton.textContent = data.isSubscribed ? 'チャンネル登録済み' : 'チャンネル登録';
        };
        updateSubscribeLabel();
        subscribeButton.addEventListener('click', async () => {
          subscribeButton.disabled = true;
          try {
            const result = await requestJSON('/api/subscribe', {
              method: 'POST',
              body: JSON.stringify({ username: channel.username || username })
            });
            data.isSubscribed = typeof result.isSubscribed === 'boolean'
              ? result.isSubscribed
              : !data.isSubscribed;
            if (typeof result.subscriberCount === 'number') {
              $('subscriber-count').textContent = result.subscriberCount.toLocaleString('ja-JP');
            } else {
              $('subscriber-count').textContent = Math.max(
                0,
                Number($('subscriber-count').textContent.replace(/,/g, '')) + (data.isSubscribed ? 1 : -1)
              ).toLocaleString('ja-JP');
            }
            updateSubscribeLabel();
          } catch (error) {
            actionNote.textContent = error.message || 'チャンネル登録を更新できませんでした。';
          } finally {
            subscribeButton.disabled = false;
          }
        });
      } else if (!data.isLoggedIn && !data.isOwner) {
        actionNote.textContent = 'チャンネル登録するにはログインしてください。';
      }

      const videos = $('videos');
      videos.replaceChildren();
      if (Array.isArray(data.videos) && data.videos.length) {
        data.videos.forEach((video) => videos.appendChild(makeVideoCard(video)));
      } else {
        showEmpty(videos, 'このチャンネルにはまだ動画がありません。');
      }

      content.hidden = false;
      message.hidden = true;
    } catch (error) {
      console.error('NowTube channel page error:', error);
      showMessage(`チャンネルを表示できませんでした。${error.message ? ` ${error.message}` : ''}`, true);
      const retry = document.createElement('button');
      retry.className = 'button secondary';
      retry.textContent = '再読み込み';
      retry.style.marginLeft = '8px';
      retry.addEventListener('click', () => location.reload());
      message.appendChild(retry);
    }
  }

  main();
})();
