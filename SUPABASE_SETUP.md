# Supabaseの手動設定手順

## 1. Supabaseアカウントの作成とプロジェクト作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ/ログイン
4. 「New project」をクリック
5. 以下を入力：
   - **Name**: survey-tool-mvp（任意の名前）
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: Northeast Asia (Tokyo) - ap-northeast-1
6. 「Create new project」をクリック
7. プロジェクトの作成完了まで2-3分待機

## 2. 環境変数の取得

プロジェクト作成後：

1. 左サイドバーの「Settings」をクリック
2. 「API」をクリック
3. 以下の値をコピー：
   - **Project URL** (https://wvlbdsrczkwtknslahch.supabase.co)
   - **anon public** key (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bGJkc3Jjemt3dGtuc2xhaGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MDE0NzAsImV4cCI6MjA2ODA3NzQ3MH0.amP21wZpTkjnIPsEyue-RivFQHysN9ZP-ljF8tDihSY)

## 3. 環境変数ファイルの作成

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下を記述：

```
NEXT_PUBLIC_SUPABASE_URL=https://あなたのプロジェクトURL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanon_publicキー
```

**重要**: 上記の値を実際の値に置き換えてください。

**注意**: 
- `.env.local`ファイルはプロジェクトのルートディレクトリ（package.jsonと同じ階層）に作成してください
- 環境変数名は必ず`NEXT_PUBLIC_`で始まる必要があります
- URLは`https://`で始まり、`.supabase.co`で終わる形式です
- キーにスペースや改行が含まれていないことを確認してください

**例**:
```
NEXT_PUBLIC_SUPABASE_URL=https://wvlbdsrczkwtknslahch.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bGJkc3Jjemt3dGtuc2xhaGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MDE0NzAsImV4cCI6MjA2ODA3NzQ3MH0.amP21wZpTkjnIPsEyue-RivFQHysN9ZP-ljF8tDihSY
```
## 4. データベースの設定

1. Supabaseダッシュボードで「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLを実行（コピー&ペースト）：

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom function for getting current user ID
CREATE OR REPLACE FUNCTION uid() RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Create function to check if current user is admin (prevents RLS recursion)
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('monitor', 'client', 'admin')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Monitor profiles table
CREATE TABLE IF NOT EXISTS monitor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  age integer NOT NULL CHECK (age >= 18 AND age <= 100),
  gender text CHECK (gender IN ('male', 'female', 'other')),
  occupation text,
  location text,
  points integer DEFAULT 0 CHECK (points >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client profiles table
CREATE TABLE IF NOT EXISTS client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'rejected')),
  points_reward integer DEFAULT 10 CHECK (points_reward > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'rating', 'yes_no', 'ranking')),
  options text[] DEFAULT '{}',
  required boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  is_multiple_select boolean DEFAULT false,
  max_selections integer DEFAULT NULL
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  monitor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '[]' NOT NULL,
  completed_at timestamptz DEFAULT now(),
  points_earned integer DEFAULT 0,
  UNIQUE(survey_id, monitor_id)
);

-- Point transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  points integer NOT NULL,
  transaction_type text DEFAULT 'earned' CHECK (transaction_type IN ('earned', 'redeemed')),
  created_at timestamptz DEFAULT now()
);

-- Point exchange requests table
CREATE TABLE IF NOT EXISTS point_exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exchange_type text NOT NULL CHECK (exchange_type IN ('paypay', 'amazon', 'starbucks')),
  points_amount integer NOT NULL CHECK (points_amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  contact_info text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  room_type text NOT NULL CHECK (room_type IN ('direct', 'group', 'support')),
  participants uuid[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_monitor_profiles_user_id ON monitor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_client_id ON surveys(client_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_monitor_id ON responses(monitor_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_monitor_id ON point_transactions(monitor_id);
CREATE INDEX IF NOT EXISTS idx_point_exchange_requests_monitor_id ON point_exchange_requests(monitor_id);
CREATE INDEX IF NOT EXISTS idx_point_exchange_requests_status ON point_exchange_requests(status);
CREATE INDEX IF NOT EXISTS idx_point_exchange_requests_created_at ON point_exchange_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (uid() = id);
CREATE POLICY "Allow user creation during signup" ON users FOR INSERT TO authenticated WITH CHECK (uid() = id);

-- RLS Policies for monitor_profiles table
CREATE POLICY "Monitor profiles are viewable by owner" ON monitor_profiles FOR SELECT TO authenticated USING (user_id = uid());
CREATE POLICY "Monitor profiles are editable by owner" ON monitor_profiles FOR ALL TO authenticated USING (user_id = uid());

-- RLS Policies for client_profiles table
CREATE POLICY "Client profiles are viewable by owner" ON client_profiles FOR SELECT TO authenticated USING (user_id = uid());
CREATE POLICY "Client profiles are editable by owner" ON client_profiles FOR ALL TO authenticated USING (user_id = uid());

-- RLS Policies for surveys table
CREATE POLICY "Published surveys are viewable by everyone" ON surveys FOR SELECT TO authenticated USING (
  status = 'active' OR client_id = uid()
);
CREATE POLICY "Surveys are editable by clients who own them" ON surveys FOR ALL TO authenticated USING (client_id = uid());
CREATE POLICY "Admins can view all surveys" ON surveys FOR SELECT TO authenticated USING (is_admin());

-- RLS Policies for questions table
CREATE POLICY "Questions are viewable by survey owners" ON questions FOR SELECT TO authenticated USING (
  survey_id IN (SELECT id FROM surveys WHERE client_id = uid())
);
CREATE POLICY "Questions are editable by survey owners" ON questions FOR ALL TO authenticated USING (
  survey_id IN (SELECT id FROM surveys WHERE client_id = uid())
);
CREATE POLICY "Questions for active surveys viewable by monitors" ON questions FOR SELECT TO authenticated USING (
  survey_id IN (SELECT id FROM surveys WHERE status = 'active') AND
  EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'monitor')
);

-- RLS Policies for responses table
CREATE POLICY "Responses are insertable by monitors" ON responses FOR INSERT TO authenticated WITH CHECK (monitor_id = uid());
CREATE POLICY "Responses are viewable by monitor who created them" ON responses FOR SELECT TO authenticated USING (monitor_id = uid());
CREATE POLICY "Survey owners can view responses" ON responses FOR SELECT TO authenticated USING (
  survey_id IN (SELECT id FROM surveys WHERE client_id = uid())
);

-- RLS Policies for point_transactions table
CREATE POLICY "Point transactions are viewable by monitor" ON point_transactions FOR SELECT TO authenticated USING (monitor_id = uid());
CREATE POLICY "Point transactions are insertable by monitors" ON point_transactions FOR INSERT TO authenticated WITH CHECK (monitor_id = uid());

-- RLS Policies for point_exchange_requests table
CREATE POLICY "Monitors can create exchange requests" ON point_exchange_requests FOR INSERT TO authenticated WITH CHECK (monitor_id = uid());
CREATE POLICY "Monitors can view own exchange requests" ON point_exchange_requests FOR SELECT TO authenticated USING (monitor_id = uid());
CREATE POLICY "Admins can view all exchange requests" ON point_exchange_requests FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update exchange requests" ON point_exchange_requests FOR UPDATE TO authenticated USING (is_admin());

-- RLS Policies for chat_rooms table
CREATE POLICY "Users can view rooms they participate in" ON chat_rooms FOR SELECT TO authenticated USING (
  uid() = ANY(participants) OR created_by = uid()
);
CREATE POLICY "Users can create chat rooms" ON chat_rooms FOR INSERT TO authenticated WITH CHECK (
  created_by = uid() AND uid() = ANY(participants)
);
CREATE POLICY "Room creators can update rooms" ON chat_rooms FOR UPDATE TO authenticated USING (created_by = uid());

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view messages in their rooms" ON chat_messages FOR SELECT TO authenticated USING (
  room_id IN (SELECT id FROM chat_rooms WHERE uid() = ANY(participants))
);
CREATE POLICY "Users can send messages to their rooms" ON chat_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = uid() AND room_id IN (SELECT id FROM chat_rooms WHERE uid() = ANY(participants))
);

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitor_profiles_updated_at BEFORE UPDATE ON monitor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for point management
CREATE OR REPLACE FUNCTION set_response_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.points_earned := (SELECT points_reward FROM surveys WHERE id = NEW.survey_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_monitor_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update monitor points
  UPDATE monitor_profiles 
  SET points = points + NEW.points_earned 
  WHERE user_id = NEW.monitor_id;
  
  -- Create point transaction record
  INSERT INTO point_transactions (monitor_id, survey_id, points, transaction_type)
  VALUES (NEW.monitor_id, NEW.survey_id, NEW.points_earned, 'earned');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for point management
CREATE TRIGGER set_response_points_trigger BEFORE INSERT ON responses FOR EACH ROW EXECUTE FUNCTION set_response_points();
CREATE TRIGGER update_monitor_points_trigger AFTER INSERT ON responses FOR EACH ROW EXECUTE FUNCTION update_monitor_points();
```

4. 「RUN」ボタンをクリックしてSQLを実行

## 5. 認証設定

1. 左サイドバーの「Authentication」をクリック
2. 「Providers」をクリック
3. 「Email」プロバイダーを見つける
4. 「Enable Email Signup」を**有効**にする（トグルをオン）
5. 「Settings」をクリック
6. 「Email confirmations」を**無効**にする（トグルをオフ）
7. 「Save」をクリック

## 6. 開発サーバーの再起動

ターミナルで以下を実行：

```bash
# 開発サーバーを停止（Ctrl+C）
# 再起動
npm run dev
```

**重要**: 環境変数を変更した後は、必ず開発サーバーを再起動してください。Next.jsでは`.env.local`ファイルを使用します。

## 6.1. 設定の確認

開発サーバー再起動後、ブラウザの開発者ツール（F12）のコンソールで以下を確認：

```
Supabase URL: https://あなたのプロジェクトURL.supabase.co
Supabase Key exists: true
```

もし`undefined`や`false`が表示される場合は、`.env.local`ファイルの設定を再確認してください。
## 7. テスト用アカウントの作成（オプション）

アプリケーションが起動したら、以下のテストアカウントを作成できます：

### 管理者アカウント
- Email: admin@example.com
- Password: admin123
- Role: admin（手動でデータベースを更新）

### モニターアカウント
- Email: monitor@example.com
- Password: monitor123
- Role: monitor

### クライアントアカウント
- Email: client@example.com
- Password: client123
- Role: client

## トラブルシューティング

### よくある問題：

1. **「Invalid API key」エラー**
   - `.env`ファイルの`VITE_SUPABASE_ANON_KEY`を確認
   - Supabaseダッシュボードから正しいキーをコピー

2. **「Project not found」エラー**
   - `.env`ファイルの`VITE_SUPABASE_URL`を確認
   - URLが正しい形式か確認（https://で始まる）

3. **「Failed to fetch」エラー**
   - `.env`ファイルがプロジェクトのルートディレクトリにあるか確認
   - 環境変数名が`VITE_`で始まっているか確認
   - 開発サーバーを再起動したか確認
   - ブラウザのコンソールでSupabase設定を確認

3. **データベースエラー**
   - SQLが正しく実行されたか確認
   - Supabaseダッシュボードの「Table Editor」でテーブルが作成されているか確認

4. **認証エラー**
   - Email confirmationが無効になっているか確認
   - RLSポリシーが正しく設定されているか確認

### 確認方法：

1. **環境変数の確認**：
   ```bash
   cat .env.local
   ```

2. **ファイルの場所確認**：
   ```bash
   ls -la | grep .env.local
   ```
   `.env.local`ファイルが表示されることを確認

3. **開発サーバーの再起動**：
   ```bash
   # Ctrl+C で停止
   npm run dev
   ```

2. **テーブルの確認**：
   Supabaseダッシュボード → Table Editor で以下のテーブルが存在するか確認：
   - users
   - monitor_profiles
   - client_profiles
   - surveys
   - questions
   - responses
   - point_transactions

問題が解決しない場合は、エラーメッセージを教えてください。