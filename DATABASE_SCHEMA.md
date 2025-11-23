# データベーススキーマとRLSポリシー一覧

最終更新: 2025年1月

## テーブル一覧とRLSポリシー

### 1. advertisements
- **ポリシー数**: 5（ALL, SELECT, SELECT, SELECT, UPDATE）
- **操作種別**: ALL, SELECT, SELECT, SELECT, UPDATE
- **用途**: 広告情報の管理
- **コードでの使用箇所**: 
  - `components/MonitorDashboard.tsx`
  - `components/ImportCsvModal.tsx`
  - `components/AdminJobInfoManager.tsx`

#### RLSポリシー詳細

| ポリシー名 | 操作 | ロール | USING句 | WITH CHECK句 | 説明 |
|-----------|------|--------|---------|--------------|------|
| Admins can update advertisements | UPDATE | authenticated | `is_admin()` | `is_admin()` | 管理者は広告を更新可能（更新後も管理者であることを確認） |

### 2. chat_messages
- **ポリシー数**: 8
- **操作種別**: ALL, ALL, INSERT, INSERT, INSERT, SELECT, SELECT, SELECT
- **用途**: チャットメッセージの保存
- **コードでの使用箇所**: 
  - `components/ChatModal.tsx`
  - `components/AdminSupportChatViewer.tsx`

### 3. chat_rooms
- **ポリシー数**: 8
- **操作種別**: ALL, ALL, INSERT, SELECT, SELECT, SELECT, SELECT, UPDATE
- **用途**: チャットルームの管理
- **コードでの使用箇所**: 
  - `components/ChatModal.tsx`
  - `components/AdminSupportChatViewer.tsx`
  - `components/AdminDashboard.tsx`

### 4. client_profiles
- **ポリシー数**: 3
- **操作種別**: ALL, SELECT, SELECT
- **用途**: クライアント（企業）のプロファイル情報
- **コードでの使用箇所**: 現在のコードベースでは直接使用されていない（将来の拡張用）

### 5. client_registration_codes
- **ポリシー数**: 3
- **操作種別**: ALL, SELECT, SELECT
- **用途**: クライアント登録用のコード管理
- **コードでの使用箇所**: 現在のコードベースでは直接使用されていない（将来の拡張用）

### 6. companies
- **ポリシー数**: 1
- **操作種別**: SELECT
- **用途**: 企業情報の管理
- **コードでの使用箇所**: 
  - `components/MatchingFeature.tsx`

### 7. monitor_profile_survey
- **ポリシー数**: 1
- **操作種別**: ALL
- **用途**: モニターの詳細プロファイル情報（就活アンケート結果）
- **コードでの使用箇所**: 
  - `components/MonitorProfileSurveyModal.tsx`
  - `components/MatchingFeature.tsx`

### 8. monitor_profiles
- **ポリシー数**: 4（ALL, SELECT, SELECT, UPDATE）
- **操作種別**: ALL, SELECT, SELECT, UPDATE
- **用途**: モニター（学生）の基本プロファイル情報
- **コードでの使用箇所**: 
  - `components/AuthForm.tsx`
  - `components/ProfileModal.tsx`
  - `components/MonitorDashboard.tsx`

#### RLSポリシー詳細

| ポリシー名 | 操作 | ロール | USING句 | WITH CHECK句 | 説明 |
|-----------|------|--------|---------|--------------|------|
| Monitors can update own profile | UPDATE | authenticated | `user_id = uid()` | `user_id = uid()` | モニターは自分のプロファイルを更新可能（更新後も自分のプロファイルであることを確認） |

### 9. point_exchange_requests
- **ポリシー数**: 5
- **操作種別**: INSERT, INSERT, SELECT, SELECT, UPDATE
- **用途**: ポイント交換リクエストの管理
- **コードでの使用箇所**: 
  - `components/PointExchangeModal.tsx`
  - `components/PointExchangeManager.tsx`

#### RLSポリシー詳細

| ポリシー名 | 操作 | ロール | USING句 | WITH CHECK句 | 説明 |
|-----------|------|--------|---------|--------------|------|
| Admins can update exchange requests | UPDATE | authenticated | `is_admin()` | `is_admin()` | 管理者は全リクエストを更新可能（更新後も管理者であることを確認） |

### 10. point_transactions
- **ポリシー数**: 3
- **操作種別**: INSERT, INSERT, SELECT
- **用途**: ポイント取引履歴の記録
- **コードでの使用箇所**: 
  - `components/PointExchangeModal.tsx`

### 11. questions
- **ポリシー数**: 3
- **操作種別**: ALL, ALL, SELECT
- **用途**: アンケートの質問項目
- **コードでの使用箇所**: 
  - `components/MonitorDashboard.tsx`
  - `components/ImportSurveyModal.tsx`

### 12. responses
- **ポリシー数**: 3
- **操作種別**: INSERT, SELECT, SELECT
- **用途**: アンケートへの回答
- **コードでの使用箇所**: 
  - `components/MonitorDashboard.tsx`
  - `components/ClientDashboard.tsx`

### 13. surveys
- **ポリシー数**: 4
- **操作種別**: ALL, ALL, SELECT, UPDATE
- **用途**: アンケートの管理
- **コードでの使用箇所**: 
  - `components/MonitorDashboard.tsx`
  - `components/ClientDashboard.tsx`
  - `components/ImportSurveyModal.tsx`
  - `components/AdminDashboard.tsx`

### 14. user_line_links
- **ポリシー数**: 1
- **操作種別**: ALL
- **用途**: ユーザーとLINEアカウントの連携情報
- **コードでの使用箇所**: 
  - `components/PointExchangeModal.tsx`

### 15. users
- **ポリシー数**: 5
- **操作種別**: INSERT, INSERT, SELECT, SELECT, UPDATE
- **用途**: ユーザー基本情報
- **コードでの使用箇所**: 
  - `hooks/useAuth.ts`
  - `components/AuthForm.tsx`
  - `components/ProfileModal.tsx`
  - `components/SupportDashboard.tsx`
  - `components/AdminDashboard.tsx`

#### RLSポリシー詳細

| ポリシー名 | 操作 | ロール | USING句 | WITH CHECK句 | 説明 |
|-----------|------|--------|---------|--------------|------|
| Support staff can view user profiles | SELECT | authenticated | `is_support_staff()` | - | サポートスタッフは全ユーザーのプロファイルを閲覧可能 |
| Users can read own data | SELECT | authenticated | `uid() = id` | - | ユーザーは自分のデータを読み取り可能 |
| Allow support user creation | INSERT | authenticated | - | `email = 'support@example.com' AND role = 'support'` | サポートユーザーの作成を許可（特定のメールアドレスのみ） |
| Allow user creation during signup | INSERT | authenticated | - | `auth.uid() = id` | サインアップ時のユーザー作成を許可（自分のIDと一致する場合のみ） |
| Users can update own data | UPDATE | authenticated | `uid() = id` | `uid() = id` | ユーザーは自分のデータを更新可能（更新後も自分のデータであることを確認） |

## RLSポリシーの詳細情報

### usersテーブルのポリシー例

`users`テーブルには5つのRLSポリシーが設定されています：

1. **Support staff can view user profiles** (SELECT)
   - サポートスタッフが全ユーザーのプロファイルを閲覧可能
   - 条件: `is_support_staff()`関数がtrueを返す

2. **Users can read own data** (SELECT)
   - ユーザーが自分のデータを読み取り可能
   - 条件: `uid() = id`（現在のユーザーIDとレコードのIDが一致）

3. **Allow support user creation** (INSERT)
   - サポートユーザーの作成を許可
   - 条件: メールアドレスが`support@example.com`かつロールが`support`

4. **Allow user creation during signup** (INSERT)
   - サインアップ時のユーザー作成を許可
   - 条件: `auth.uid() = id`（認証されたユーザーIDとレコードのIDが一致）

5. **Users can update own data** (UPDATE)
   - ユーザーが自分のデータを更新可能
   - 条件: `uid() = id`（現在のユーザーIDとレコードのIDが一致）

### 他のテーブルのポリシー詳細

他のテーブルの詳細なポリシー内容を確認するには、SupabaseダッシュボードのSQL Editorで以下を実行してください：

```sql
-- check_rls_policies_detail.sql を実行
-- または、特定のテーブルを指定して確認
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'テーブル名';
```

## セキュリティに関する注意事項

### UPDATEポリシーのWITH CHECK句について

**✅ 全テーブル確認完了**: すべてのUPDATEポリシーにWITH CHECK句が適切に設定されています。

| テーブル名 | UPDATEポリシー数 | WITH CHECK句あり | 状態 |
|-----------|-----------------|-----------------|------|
| advertisements | 1 | 1 | ✅ OK |
| chat_rooms | 1 | 1 | ✅ OK |
| monitor_profiles | 1 | 1 | ✅ OK |
| point_exchange_requests | 1 | 1 | ✅ OK |
| surveys | 1 | 1 | ✅ OK |
| users | 1 | 1 | ✅ OK |

**確認日**: 2025年1月
**確認SQL**: `check_update_policies.sql`を実行

これにより、すべてのテーブルで更新後のデータも適切に検証され、セキュリティが確保されています。

#### 修正履歴

- **2025年1月**: 
  - `users`テーブルと`point_exchange_requests`テーブルのUPDATEポリシーにWITH CHECK句を追加
    - 修正SQL: `fix_rls_policies.sql`を実行
  - `monitor_profiles`テーブルと`advertisements`テーブルにUPDATEポリシーを追加
    - 修正SQL: `add_missing_update_policies.sql`を実行
  - `advertisements`テーブルのDELETE操作を管理者のみに制限
    - 修正SQL: `fix_advertisements_delete_policy.sql`を実行

### DELETE操作のセキュリティについて

**✅ 確認完了**: DELETE操作が必要なテーブルは適切に保護されています。

| テーブル名 | DELETE操作 | 保護方法 | 状態 |
|-----------|-----------|---------|------|
| `advertisements` | ✅ コードで使用 | ALLポリシー（管理者のみ） | ✅ OK |
| `surveys` | ✅ コードで使用 | ALLポリシー（管理者または自分のアンケート） | ✅ OK |

**確認日**: 2025年1月  
**確認SQL**: `check_all_policies_for_delete.sql`を実行

### RLSポリシーの重複について
一部のテーブルで同じ操作種別（例: SELECT）のポリシーが複数存在しています。これは以下の理由が考えられます：
- 異なるロール（monitor, client, admin）に対する個別のポリシー
- 異なる条件（USING句）によるポリシー
- 異なる用途（例: 自分のデータと全データの閲覧）

詳細なポリシー内容を確認するには、`check_rls_policies_detail.sql`を実行してください。

### 未使用テーブル
以下のテーブルは現在のコードベースで直接使用されていませんが、将来の機能拡張用に存在しています：
- `client_profiles`
- `client_registration_codes`

これらのテーブルは、クライアント（企業）機能の実装時に使用される予定です。

## 確認方法

データベースの現在の状態を確認するには、SupabaseダッシュボードのSQL Editorで以下を実行してください：

```sql
-- 詳細な情報を確認
-- check_tables.sql を実行

-- または簡易版
-- check_tables_simple.sql を実行
```

