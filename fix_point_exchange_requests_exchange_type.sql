-- point_exchange_requestsテーブルのexchange_type CHECK制約を修正
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. 既存のCHECK制約を削除
ALTER TABLE point_exchange_requests 
  DROP CONSTRAINT IF EXISTS point_exchange_requests_exchange_type_check;

-- 2. 新しいCHECK制約を追加（erabepayとerabegiftを追加）
ALTER TABLE point_exchange_requests 
  ADD CONSTRAINT point_exchange_requests_exchange_type_check 
  CHECK (exchange_type IN ('paypay', 'amazon', 'starbucks', 'erabepay', 'erabegift'));

-- 3. 制約が正しく設定されたか確認
SELECT 
    conname AS "制約名",
    pg_get_constraintdef(oid) AS "制約定義"
FROM 
    pg_constraint
WHERE 
    conrelid = 'point_exchange_requests'::regclass
    AND conname = 'point_exchange_requests_exchange_type_check';

