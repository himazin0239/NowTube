
import { upload } from 'https://esm.sh/@vercel/blob@1.1.1/client?bundle';

const form = document.getElementById('upload-form');
const titleInput = document.getElementById('video-title');
const descriptionInput = document.getElementById('video-description');
const fileInput = document.getElementById('video-file');
const button = document.getElementById('upload-button');
const status = document.getElementById('status');
const accountStatus = document.getElementById('account-status');

const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
let loggedInUser = null;

async function checkLogin() {
  try {
    const response = await fetch('/api/me', { cache: 'no-store' });
    const data = await response.json();
    loggedInUser = data.user;

    if (!loggedInUser) {
      accountStatus.innerHTML =
        '投稿するには<a href="./login.html?next=./upload.html">ログイン</a>してください。';
      form.querySelectorAll('input,textarea,button').forEach(function (element) {
        element.disabled = true;
      });
    } else {
      accountStatus.textContent = 'ログイン中: ' + loggedInUser.username;
    }
  } catch (error) {
    accountStatus.textContent = 'ログイン状態を確認できません。';
    console.error(error);
  }
}

function makeThumbnail(file) {
  return new Promise(function (resolve, reject) {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    let finished = false;

    const timeoutId = window.setTimeout(function () {
      finish(new Error(
        '動画の読み込みがタイムアウトしました。MP4（H.264）の動画で試してください。'
      ));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    }

    function finish(error, blob) {
      if (finished) return;
      finished = true;
      cleanup();

      if (error) {
        reject(error);
      } else {
        resolve(blob);
      }
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = function () {
      try {
        if (!video.videoWidth || !video.videoHeight) {
          finish(new Error(
            '動画のサイズを読み取れませんでした。別のMP4動画で試してください。'
          ));
          return;
        }

        const targetTime =
          Number.isFinite(video.duration) && video.duration > 0
            ? Math.min(1, video.duration * 0.1)
            : 0;

        video.currentTime = targetTime;
      } catch (error) {
        finish(error);
      }
    };

    video.onseeked = function () {
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 640 / video.videoWidth);

        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

        const context = canvas.getContext('2d');

        if (!context) {
          finish(new Error('サムネイル用のCanvasを作成できませんでした。'));
          return;
        }

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob(function (blob) {
          if (blob) {
            finish(null, blob);
          } else {
            finish(new Error('サムネイル画像を生成できませんでした。'));
          }
        }, 'image/jpeg', 0.82);
      } catch (error) {
        finish(error);
      }
    };

    video.onerror = function () {
      finish(new Error(
        'この動画からサムネイルを生成できません。MP4（H.264）の動画を試してください。'
      ));
    };

    // 選択した動画を読み込む
    video.src = objectUrl;
    video.load();
  });
}

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const file = fileInput.files && fileInput.files[0];
  const title = titleInput.value.trim();

  if (!loggedInUser) {
    status.textContent = '先にログインしてください。';
    return;
  }

  if (!title) {
    status.textContent = 'タイトルを入力してください。';
    return;
  }

  if (!file) {
    status.textContent = '動画ファイルを選択してください。';
    return;
  }

  const extension = file.name.toLowerCase().split('.').pop();

  if (
    !ALLOWED.includes(file.type) &&
    !['mp4', 'webm', 'mov', 'm4v'].includes(extension)
  ) {
    status.textContent = 'MP4、WebM、MOV、M4Vの動画を選んでください。';
    return;
  }

  if (file.size > MAX_SIZE) {
    status.textContent = 'ファイルが大きすぎます。100 MiB以下の動画を選んでください。';
    return;
  }

  button.disabled = true;
  status.textContent = 'サムネイルを生成しています…';

  try {
    const thumbnailBlob = await makeThumbnail(file);

    status.textContent = 'サムネイルをアップロードしています…';

    const uploadedThumbnail = await upload('thumbnail.jpg', thumbnailBlob, {
      access: 'public',
      handleUploadUrl: '/api/thumbnail-upload'
    });

    status.textContent =
      '動画をアップロードしています…\nこのページを閉じずにお待ちください。';

    await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({
        title: title,
        description: descriptionInput.value.trim(),
        thumbnailUrl: uploadedThumbnail.url
      })
    });

    status.textContent =
      'アップロードが完了しました！ NowTubeのホームへ移動します…';

    window.setTimeout(function () {
      window.location.href = './index.html';
    }, 1200);
  } catch (error) {
    console.error(error);

    status.textContent =
      'アップロードに失敗しました。\n' +
      (error && error.message
        ? error.message
        : 'Vercel Blob・データベースの設定や動画形式を確認してください。');

    button.disabled = false;
  }
});

checkLogin();
