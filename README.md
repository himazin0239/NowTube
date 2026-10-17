# NowTube
![NowTube Logo](./img/logo.gif)

*Shoot Your Life™*

2010年頃のあの懐かしいYouTubeの雰囲気をそのまま再現した、ノスタルジックな動画共有ウェブサイトです。

## 開発状況

- [x] レトロなロゴ＆ヘッダー
- [x] 2010年風の動画視聴ページ (部分的に)
- [ ] コメント＆お気に入り機能
- [ ] 昔のYouTubeにあった「チャンネル登録者数のガタガタしたフォント感」の再現

## コンセプト

スマートフォンの普及前、ネットサーフィンが最高にワクワクしていた **2010年前後** のウェブデザインをオマージュしています。
* ちょっとレトロで味のあるUI
* シンプルで無駄のない動画プレイヤー周り
* 5段階の星評価（Rating）やコメント欄の空気感

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

## ログイン・データベース機能

### 必須のVercel環境変数
- `DATABASE_URL`: Neon PostgreSQLの接続文字列（Vercelの環境変数に設定）
- `SESSION_SECRET`: 32文字以上のランダムな秘密値（公開しない）
- `BLOB_READ_WRITE_TOKEN`: Vercel Blobの読み書きトークン（既存設定を維持）

`NOWTUBE_UPLOAD_PASSWORD` は新しい投稿処理では使用しません。既存の変数は残しても構いません。

### セットアップ
1. NeonでPostgreSQLデータベースを作成し、接続文字列をVercelの `DATABASE_URL` に登録します。独自ドメインは不要です。
2. `SESSION_SECRET` に十分長いランダム文字列を設定します。
3. Vercelで再デプロイします。初回のAPIアクセス時に必要なテーブルが自動作成されます。
4. `/login.html?mode=register` を開いてアカウントを作成します。
5. ログイン後に動画投稿を試してください。

### 注意
- パスワードはscryptでハッシュ化し、セッションはHttpOnly Cookieで管理します。
- サムネイルはブラウザ側で動画のフレームからJPEGを作成し、Vercel Blobへ保存します。ブラウザが動画をデコードできない形式では生成に失敗する場合があります。MP4（H.264/AAC）を推奨します。
- デプロイ前にテスト用アカウントで動作確認してください。既存の旧形式の動画メタデータは新しいデータベース一覧には自動移行されません。

---
*Enjoy the 2010 internet vibe!*