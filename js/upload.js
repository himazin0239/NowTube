import { upload } from 'https://esm.sh/@vercel/blob/client@1.1.1?bundle';

const form = document.getElementById('upload-form');
const titleInput = document.getElementById('video-title');
const descriptionInput = document.getElementById('video-description');
const passwordInput = document.getElementById('upload-password');
const fileInput = document.getElementById('video-file');
const button = document.getElementById('upload-button');
const status = document.getElementById('status');
const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = fileInput.files && fileInput.files[0];
  const title = titleInput.value.trim();
  if (!title) { status.textContent = 'タイトルを入力してください。'; return; }
  if (!file) { status.textContent = '動画ファイルを選択してください。'; return; }
  const ext = file.name.toLowerCase().split('.').pop();
  if (!ALLOWED.includes(file.type) && !['mp4', 'webm', 'mov', 'm4v'].includes(ext)) {
    status.textContent = 'MP4、WebM、MOV、M4Vの動画を選んでください。'; return;
  }
  if (file.size > MAX_SIZE) { status.textContent = 'ファイルが大きすぎます。100 MiB以下の動画を選んでください。'; return; }

  button.disabled = true;
  status.textContent = 'アップロードの準備中です…\nこのページを閉じずにお待ちください。';
  try {
    await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({ title, description: descriptionInput.value.trim(), password: passwordInput.value })
    });
    status.textContent = 'アップロードが完了しました！ NowTubeのホームへ移動します…';
    window.setTimeout(() => { window.location.href = './index.html'; }, 1200);
  } catch (error) {
    console.error(error);
    status.textContent = 'アップロードに失敗しました。\n' + (error?.message || 'Vercel Blobの設定やネットワークを確認してください。');
    button.disabled = false;
  }
});
