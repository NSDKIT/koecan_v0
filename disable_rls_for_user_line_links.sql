-- user_line_linksテーブルのRLSを一時的に無効化（デバッグ用）
-- 注意: 本番環境では使用しないでください。セキュリティ上のリスクがあります。
-- このSQLは、service_roleキーが正しく動作しているか確認するための一時的な措置です。

-- RLSを無効化
ALTER TABLE user_line_links DISABLE ROW LEVEL SECURITY;

-- 確認
SELECT 
    tablename,
    rowsecurity AS "RLS有効"
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename = 'user_line_links';

-- RLSを再度有効化する場合は、以下を実行してください：
-- ALTER TABLE user_line_links ENABLE ROW LEVEL SECURITY;

