// 就活で気をつけるべきポイント、豆知識、雑学のデータ

export type TipCategory = 'job_hunting' | 'trivia' | 'knowledge';

export interface Tip {
  category: TipCategory;
  content: string; // 2行で完結する内容
}

// 就活で気をつけるべきポイント（100個）
const jobHuntingTips: Tip[] = [
  { category: 'job_hunting', content: '早期準備\n大学3年\n6月開始' },
  { category: 'job_hunting', content: '自己分析\n強みと弱み\n各5つ書く' },
  { category: 'job_hunting', content: '業界研究\n最低10業界\n調べておく' },
  { category: 'job_hunting', content: '企業研究\n志望企業は\n30社以上' },
  { category: 'job_hunting', content: 'ES締切\n提出期限\n3日前目標' },
  { category: 'job_hunting', content: '写真撮影\n就活用写真\n専門店利用' },
  { category: 'job_hunting', content: '髪型\n前髪は眉に\nかからない' },
  { category: 'job_hunting', content: 'スーツ\n黒か紺の\n無地が基本' },
  { category: 'job_hunting', content: '靴の色\n黒の革靴が\n最も無難' },
  { category: 'job_hunting', content: '鞄選び\nA4書類\n入る黒鞄' },
  { category: 'job_hunting', content: '時計\nシンプルな\nアナログ型' },
  { category: 'job_hunting', content: 'ネクタイ\n青系か赤系\n好印象' },
  { category: 'job_hunting', content: '靴下\n黒か紺無地\n丈は長めに' },
  { category: 'job_hunting', content: 'メイク\nナチュラル\nメイク基本' },
  { category: 'job_hunting', content: '爪の手入れ\n短く清潔に\n保つこと' },
  { category: 'job_hunting', content: '香水\n面接時には\nつけない' },
  { category: 'job_hunting', content: '筆記試験\nSPI対策\n3ヶ月前から' },
  { category: 'job_hunting', content: '適性検査\n性格検査は\n一貫性保つ' },
  { category: 'job_hunting', content: '時事問題\n新聞は毎日\n読む習慣を' },
  { category: 'job_hunting', content: '志望動機\n企業理念と\n価値観結ぶ' },
  { category: 'job_hunting', content: '自己PR\n具体的な\nエピソード' },
  { category: 'job_hunting', content: 'ガクチカ\n成果よりも\n過程を語る' },
  { category: 'job_hunting', content: '逆質問\n最低3つは\n用意する' },
  { category: 'job_hunting', content: '挫折経験\n失敗からの\n学びを語る' },
  { category: 'job_hunting', content: '長所短所\n短所には\n改善策添え' },
  { category: 'job_hunting', content: '入社後\n3年後5年後\nビジョン語る' },
  { category: 'job_hunting', content: '面接到着\n会場には\n15分前着' },
  { category: 'job_hunting', content: '受付対応\n受付でも\n丁寧に話す' },
  { category: 'job_hunting', content: '待機姿勢\n待合室でも\n気を抜かず' },
  { category: 'job_hunting', content: '入室マナー\nノックは\n3回が常識' },
  { category: 'job_hunting', content: '挨拶\nお辞儀は\n30度45度' },
  { category: 'job_hunting', content: '着席\n勧められて\nから座る' },
  { category: 'job_hunting', content: '視線\n面接官の目\n見て話す' },
  { category: 'job_hunting', content: '話す速さ\nゆっくり\n落ち着いて' },
  { category: 'job_hunting', content: '声の大きさ\nハキハキと\n明るい声' },
  { category: 'job_hunting', content: '姿勢\n背筋伸ばし\n手は膝上' },
  { category: 'job_hunting', content: '笑顔\n自然な笑顔\n好印象作る' },
  { category: 'job_hunting', content: '相槌\n適度な相槌\n傾聴示す' },
  { category: 'job_hunting', content: '結論\n結論から先\n話す癖を' },
  { category: 'job_hunting', content: '具体性\n数字使って\n具体的に' },
  { category: 'job_hunting', content: '敬語\n尊敬語と\n謙譲語使う' },
  { category: 'job_hunting', content: '退室\n最後まで\n気を抜かず' },
  { category: 'job_hunting', content: 'お礼状\n面接後\n24時間内' },
  { category: 'job_hunting', content: '電話応対\n静かな場所\nメモ取る' },
  { category: 'job_hunting', content: 'メール\n件名は\n簡潔明瞭に' },
  { category: 'job_hunting', content: '署名\n大学名\n学部名必須' },
  { category: 'job_hunting', content: '返信速度\n企業メール\n24時間内' },
  { category: 'job_hunting', content: '言葉遣い\nお世話に\nなっており' },
  { category: 'job_hunting', content: '添付ファイル\nPDFで送る\n一般的' },
  { category: 'job_hunting', content: '日程調整\n複数候補日\n提示する' },
  { category: 'job_hunting', content: 'OB訪問\n最低5人\n話を聞く' },
  { category: 'job_hunting', content: '質問準備\n訪問前に\n10個考える' },
  { category: 'job_hunting', content: 'お礼\n訪問後は\nメール送る' },
  { category: 'job_hunting', content: '説明会\n前列中央の\n席を狙う' },
  { category: 'job_hunting', content: 'メモ取り\n重要ポイント\n必ずメモ' },
  { category: 'job_hunting', content: '質問時間\n積極的に\n関心示す' },
  { category: 'job_hunting', content: '名刺交換\n両手で受け\n丁寧に扱う' },
  { category: 'job_hunting', content: '内定辞退\n電話で\n誠意伝える' },
  { category: 'job_hunting', content: '保留連絡\n正直に\n状況説明' },
  { category: 'job_hunting', content: '承諾期限\n企業指定\n期限守る' },
  { category: 'job_hunting', content: '複数内定\n比較検討\n慎重に決定' },
  { category: 'job_hunting', content: '入社書類\n期限厳守\n不備なく' },
  { category: 'job_hunting', content: '健康診断\n指定期間内\n受診する' },
  { category: 'job_hunting', content: 'SNS管理\n就活中は\n投稿注意' },
  { category: 'job_hunting', content: '写真投稿\n飲酒画像は\n削除する' },
  { category: 'job_hunting', content: '鍵アカ\n本名検索\n可能性あり' },
  { category: 'job_hunting', content: '友人選別\nつながりを\n見直す' },
  { category: 'job_hunting', content: 'グループディスカッション\nまず役割\n決める' },
  { category: 'job_hunting', content: '司会役\n全員の意見\n引き出す' },
  { category: 'job_hunting', content: '書記役\n議論整理し\n記録する' },
  { category: 'job_hunting', content: 'タイムキーパー\n時間配分\n適切管理' },
  { category: 'job_hunting', content: '発表者\n簡潔明瞭\nまとめる' },
  { category: 'job_hunting', content: '傾聴力\n他者の意見\nしっかり聞く' },
  { category: 'job_hunting', content: '協調性\nチームワーク\n最優先' },
  { category: 'job_hunting', content: '論理性\n根拠を示し\n意見述べる' },
  { category: 'job_hunting', content: 'インターン\n長期の方が\n評価高い' },
  { category: 'job_hunting', content: '実務経験\n学んだこと\n言語化する' },
  { category: 'job_hunting', content: '人脈作り\n同期との\n繋がり大切' },
  { category: 'job_hunting', content: 'フィードバック\n評価を次に\n活かす' },
  { category: 'job_hunting', content: '業界動向\n最新ニュース\n毎日チェック' },
  { category: 'job_hunting', content: '競合分析\n志望業界の\n主要企業' },
  { category: 'job_hunting', content: 'IR情報\n財務状況も\n確認する' },
  { category: 'job_hunting', content: '社風理解\n口コミサイト\n参考にする' },
  { category: 'job_hunting', content: '福利厚生\n詳細は\n募集要項で' },
  { category: 'job_hunting', content: '給与体系\n初任給と\n昇給も見る' },
  { category: 'job_hunting', content: '残業時間\n平均残業を\n質問する' },
  { category: 'job_hunting', content: '離職率\n3年後離職率\n重要指標' },
  { category: 'job_hunting', content: '女性活躍\n育休取得率\n復職率見る' },
  { category: 'job_hunting', content: 'キャリアパス\n昇進制度や\n評価基準' },
  { category: 'job_hunting', content: '転勤\n転勤の有無\n頻度確認' },
  { category: 'job_hunting', content: 'スケジュール管理\n手帳アプリ\n一元化' },
  { category: 'job_hunting', content: '体調管理\n睡眠時間\n6時間以上' },
  { category: 'job_hunting', content: 'ストレス対処\n趣味の時間\n大切にする' },
  { category: 'job_hunting', content: '相談相手\nキャリア\nセンター活用' },
  { category: 'job_hunting', content: '情報収集\n就活サイト\n複数登録' },
  { category: 'job_hunting', content: '選考状況\nエクセルで\n管理便利' },
  { category: 'job_hunting', content: '交通費\n領収書は\n必ず保管' },
  { category: 'job_hunting', content: 'スケジュール\nダブル\nブッキング注意' },
  { category: 'job_hunting', content: '最終確認\n前日持ち物\n必ずチェック' },
  { category: 'job_hunting', content: 'ポジティブ思考\n失敗は\n成長の糧' },
];

// 豆知識（空配列 - 必要に応じて追加可能）
const triviaTips: Tip[] = [];

// 雑学（空配列 - 必要に応じて追加可能）
const knowledgeTips: Tip[] = [];

// 全カテゴリーを統合
export const ALL_TIPS: Tip[] = [
  ...jobHuntingTips,
  ...triviaTips,
  ...knowledgeTips,
];

// カテゴリー別にランダムに取得する関数
export const getRandomTip = (category?: TipCategory): Tip => {
  if (category) {
    const categoryTips = ALL_TIPS.filter(tip => tip.category === category);
    if (categoryTips.length === 0) {
      // カテゴリーに該当するtipsがない場合は、全tipsから返す
      return ALL_TIPS[Math.floor(Math.random() * ALL_TIPS.length)];
    }
    return categoryTips[Math.floor(Math.random() * categoryTips.length)];
  }
  return ALL_TIPS[Math.floor(Math.random() * ALL_TIPS.length)];
};
