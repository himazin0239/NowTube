# NowTube 📺✨
*Shoot Your Life™*

2010年前後のYouTubeをイメージしたレトロな動画共有サイトです。

## Vercelへのデプロイ

このプロジェクトは静的HTML/CSSに加えて、Vercel FunctionsとVercel Blobを使います。

1. このフォルダをGitHubリポジトリにpushして、Vercelでプロジェクトとしてインポートします。
2. VercelのStorageから **Blob store** を作成し、このプロジェクトに接続します。
3. Vercelの **Settings → Environment Variables** で `NOWTUBE_UPLOAD_PASSWORD` を設定します。これは投稿ページ用の秘密のパスワードです。ソースコードや公開チャットには書かないでください。
4. デプロイを実行します。依存関係 `@vercel/blob` は `package.json` からインストールされます。
5. `/upload.html` を開き、投稿用パスワード、タイトル、動画を入力します。

## アップロード仕様

- 対応形式：MP4、WebM、MOV、M4V（実際の再生可否は動画コーデックにも依存します）
- 最大サイズ：100 MiB
- 投稿情報はBlob内の `metadata/` にJSONとして保存します。
- `index.html` と `mobile.html` は `/api/videos` から動画一覧を取得します。
- 動画再生ページは `watch.html?id=動画ID` です。

## 注意

- Blobストレージが接続されていない場合、アップロードと一覧APIは動きません。
- `NOWTUBE_UPLOAD_PASSWORD` は必ずVercelの環境変数に設定し、GitHubへ書き込まないでください。
- この実装は管理者用の簡易パスワード保護です。本格的な一般公開コミュニティにする場合は、アカウント、投稿者ごとの認証、レート制限、通報・削除機能を追加してください。
- アップロードした動画は公開URLで保存されます。自分が投稿・共有する権利を持つ動画だけを投稿してください。
