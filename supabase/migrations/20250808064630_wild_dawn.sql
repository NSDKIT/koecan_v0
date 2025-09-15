/*
  # 管理者ユーザーの作成

  1. 新しいユーザー
    - `admin@example.com` の管理者アカウントを作成
    - roleを `admin` に設定
    - 名前を「システム管理者」に設定

  2. 注意事項
    - このユーザーはSupabase Authでの認証も必要です
    - パスワードは別途アプリケーション上でサインアップ時に設定してください
*/

-- 管理者ユーザーを作成
INSERT INTO users (
  id,
  email,
  role,
  name,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'admin',
  'システム管理者',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  name = 'システム管理者',
  updated_at = now();