-- 掲示板にダミーデータを追加
-- 注意: author_idは実際の管理者ユーザーIDに置き換えてください

-- 就活（合同説明会・インターンシップ）
INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
VALUES 
  (
    '合同説明会のお知らせ',
    '来月、大手企業による合同説明会を開催します。\n\n日時: 2024年12月15日（日）10:00-17:00\n場所: 大学講堂\n\n参加企業:\n- 株式会社A\n- 株式会社B\n- 株式会社C\n\n事前登録が必要です。詳細は学生課までお問い合わせください。',
    (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1),
    false,
    1,
    '就活',
    NOW() - INTERVAL '2 days'
  ),
  (
    'インターンシップ募集開始',
    '2025年夏期インターンシップの募集を開始しました。\n\n対象: 2年生以上\n期間: 2025年7月-8月（2週間〜1ヶ月）\n\n応募方法:\n1. エントリーフォームに記入\n2. 履歴書を提出\n3. 面接\n\n締切: 2025年1月31日\n\n詳細は就職支援課まで。',
    (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1),
    false,
    2,
    '就活',
    NOW() - INTERVAL '5 days'
  );

-- サークル
INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
VALUES 
  (
    'テニスサークル新メンバー募集',
    'テニスサークルでは新メンバーを募集しています！\n\n活動内容:\n- 週2回の練習（水曜・土曜）\n- 月1回の大会参加\n- 合宿（年2回）\n\n初心者大歓迎！ラケットは貸し出し可能です。\n\n見学も随時受け付けています。\n連絡先: tennis@example.com',
    (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1),
    false,
    3,
    'サークル',
    NOW() - INTERVAL '3 days'
  );

-- 学生イベント
INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
VALUES 
  (
    '学園祭実行委員会メンバー募集',
    '来年の学園祭に向けて、実行委員会のメンバーを募集しています！\n\n活動内容:\n- 企画立案\n- 準備作業\n- 当日の運営\n\nやりがいのある活動です。ぜひご参加ください！\n\n説明会: 12月10日（火）18:00〜\n場所: 学生ホール',
    (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1),
    false,
    4,
    '学生イベント',
    NOW() - INTERVAL '1 day'
  );

-- バイト
INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
VALUES 
  (
    'カフェスタッフ募集',
    '大学近くのカフェでスタッフを募集しています。\n\n時給: 1,200円\n勤務時間: 週3回以上、1回3時間以上\n\n条件:\n- 接客が好きな方\n- 明るく元気な方\n- 長期勤務可能な方\n\n詳細は店舗まで直接お問い合わせください。\nTEL: 03-XXXX-XXXX',
    (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1),
    false,
    5,
    'バイト',
    NOW() - INTERVAL '4 days'
  );

-- 雑談
INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
VALUES 
  (
    '勉強会を開催します',
    'プログラミング勉強会を開催します！\n\n内容:\n- Web開発の基礎\n- 実践的なプロジェクト作成\n- コードレビュー\n\n日時: 毎週金曜日 19:00-21:00\n場所: 情報処理教室\n\n初心者から上級者まで、どなたでも参加可能です。\n興味のある方は気軽に参加してください！',
    (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1),
    false,
    6,
    '雑談',
    NOW() - INTERVAL '6 days'
  );

