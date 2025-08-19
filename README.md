# Ball Barrier Game

マウス/タッチで線を引いてボールが境界から出ないようにするThree.js製の3Dゲームです。

## ゲーム概要

- **目的**: マウスやタッチで線を引いて、ボールが赤い境界線から外に出ないようにする
- **技術**: TypeScript + Three.js + Vite
- **対応デバイス**: PC（マウス操作）、スマートフォン・タブレット（タッチ操作）
- **特徴**: 時間経過とともにボールの数と速度が増加し、難易度が上昇

## 必要環境

- **Docker**: 20.10以上
- **Docker Compose**: 2.0以上

または

- **Node.js**: 18以上
- **npm**: 9以上

## Docker を使った起動方法（推奨）

このプロジェクトでは、開発環境と本番環境で異なるDockerセットアップを提供しています。

### 1. 開発環境での起動

開発環境では、コード変更時の自動リロード（ホットリロード）が有効になります。

```bash
# 開発環境用コンテナを起動
docker compose --profile dev up ballbarrier-dev

# またはバックグラウンドで起動
docker compose --profile dev up -d ballbarrier-dev
```

**開発環境の特徴:**
- Viteの開発サーバーが起動
- ファイル変更時の自動リロード
- ソースマップ対応でデバッグしやすい
- アクセス先: http://localhost:5173

**開発環境の構成:**
- ベースイメージ: `node:18-alpine`
- ボリュームマウント: `app/`フォルダをマウント
- ポート: 5173 (Viteデフォルト)
- 実行コマンド: `npm install && npm run dev`

### 2. 本番環境での起動

本番環境では、最適化されたビルド済みファイルがNginxで配信されます。

```bash
# 本番環境用コンテナをビルド・起動
docker compose up ballbarrier-game

# またはバックグラウンドで起動
docker compose up -d ballbarrier-game
```

**本番環境の特徴:**
- TypeScriptコンパイル + Viteビルドで最適化
- Nginxによる高速な静的ファイル配信
- 本番環境相当のパフォーマンス
- アクセス先: http://localhost:8080

**本番環境の構成:**
- マルチステージビルド:
  1. **ビルドステージ** (`node:18-alpine`): TypeScript + Viteビルド
  2. **配信ステージ** (`nginx:alpine`): 静的ファイル配信
- ポート: 8080 (Nginx)
- 最適化: コード分割、圧縮、TreeShaking適用済み

### 3. コンテナの管理

```bash
# 実行中のコンテナを確認
docker compose ps

# ログを確認
docker compose logs ballbarrier-dev     # 開発環境
docker compose logs ballbarrier-game    # 本番環境

# コンテナを停止
docker compose down

# コンテナを停止してボリュームも削除
docker compose down -v

# イメージを再ビルド（Dockerfileに変更があった場合）
docker compose build ballbarrier-game

# キャッシュを無視して完全再ビルド
docker compose build --no-cache ballbarrier-game
```

### 4. トラブルシューティング

**ポートが既に使用されている場合:**
```bash
# 使用中のポートを確認
lsof -i :5173  # 開発環境
lsof -i :8080  # 本番環境

# docker-compose.ymlでポートを変更
# ports: "5174:5173" のように変更
```

**コンテナが起動しない場合:**
```bash
# Docker環境の確認
docker --version
docker compose --version

# コンテナのログを詳細表示
docker compose logs -f ballbarrier-dev

# コンテナ内に入ってデバッグ
docker compose exec ballbarrier-dev sh
```

**ボリュームマウントの問題:**
```bash
# 開発環境でnode_modulesが正しくマウントされない場合
docker compose down -v
docker compose --profile dev up ballbarrier-dev
```

## ローカル環境での起動方法

Dockerを使わずに直接実行することも可能です。

```bash
# appフォルダに移動
cd app

# 依存関係をインストール
npm install

# 開発サーバーを起動（ホットリロード有効）
npm run dev
# アクセス先: http://localhost:5173

# 本番用ビルド
npm run build

# ビルド結果をプレビュー
npm run preview
# アクセス先: http://localhost:4173
```

## プロジェクト構成

```
ballbarrier/
├── app/                 # Viteアプリケーション
│   ├── src/
│   │   └── main.ts      # メインゲームロジック
│   ├── index.html       # HTMLテンプレート
│   ├── package.json     # Node.js依存関係
│   ├── tsconfig.json    # TypeScript設定
│   └── vite.config.ts   # Vite設定
├── Dockerfile           # 本番環境用Dockerイメージ
├── docker-compose.yml   # Docker Compose設定
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## ゲームの遊び方

1. **ゲーム開始**: 「ゲーム開始」ボタンをクリック
2. **線を引く**: マウスドラッグまたはタッチ操作で線を描画
3. **ボールを守る**: 描いた線でボールが赤い境界から出ないように誘導
4. **難易度上昇**: 時間経過とともにボールの数と速度が増加
5. **ゲームオーバー**: ボールが境界から出るか、線が境界を越えると終了

## 技術仕様

- **フレームワーク**: Vite 5.0
- **言語**: TypeScript 5.0
- **3Dライブラリ**: Three.js 0.158
- **ビルドツール**: esbuild (Vite内包)
- **開発サーバー**: Vite Dev Server
- **本番配信**: Nginx (Alpine Linux)

## ライセンス

MIT License

## 開発者向け情報

### IDE・エディタの使用方法

開発環境コンテナには **Opencode** と **Claude Code** が導入されており、コンテナ内で直接使用できます。

#### Opencode の使用方法

```bash
# コンテナ内でbashを開いてから実行
docker compose exec ballbarrier-dev bash
opencode .

# または直接実行
docker compose exec ballbarrier-dev opencode .
```

#### Claude Code の使用方法

```bash
# コンテナ内でbashを開いてから実行
docker compose exec ballbarrier-dev bash
claude-code

# または直接実行
docker compose exec ballbarrier-dev claude-code
```

### コードの修正方法

1. **開発環境を起動**:
   ```bash
   docker compose --profile dev up ballbarrier-dev
   ```

2. **ソースコード編集**: `app/src/main.ts`や`app/index.html`を編集
   - IDE: `docker compose exec ballbarrier-dev opencode .`
   - AI支援: `docker compose exec ballbarrier-dev claude-code`

3. **自動リロード**: ブラウザが自動的にリロードされ、変更が反映される

### デプロイ方法

1. **本番ビルドのテスト**:
   ```bash
   docker compose up ballbarrier-game
   ```

2. **動作確認**: http://localhost:8080 でゲームが正常に動作することを確認

3. **本番環境デプロイ**: 生成された`app/dist/`フォルダの内容をWebサーバーにアップロード
