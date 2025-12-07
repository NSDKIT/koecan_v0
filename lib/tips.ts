// 就活で気をつけるべきポイント、豆知識、雑学のデータ

export type TipCategory = 'job_hunting' | 'trivia' | 'knowledge';

export interface Tip {
  category: TipCategory;
  content: string; // 2行で完結する内容
}

// 就活で気をつけるべきポイント（100個）
const jobHuntingTips: Tip[] = [
  { category: 'job_hunting', content: '就活準備は早めに\n大学3年の6月\nスタートが理想的' },
  { category: 'job_hunting', content: '自己分析をして\n強みと弱みを各\n5つずつ書き出す' },
  { category: 'job_hunting', content: '業界研究として\n最低でも10業界\n調べておこう' },
  { category: 'job_hunting', content: '志望する企業を\n30社以上は\nリストアップする' },
  { category: 'job_hunting', content: 'ESの提出期限は\n締切の3日前を\n目標にしよう' },
  { category: 'job_hunting', content: '就活用の写真は\n専門店で撮影\nするのがお勧め' },
  { category: 'job_hunting', content: '前髪は眉毛に\nかからない長さに\n整えておこう' },
  { category: 'job_hunting', content: 'スーツは黒色か\n紺色の無地を\n選ぶのが基本' },
  { category: 'job_hunting', content: '靴は黒色の革靴が\n最も無難で安全\nだと言われている' },
  { category: 'job_hunting', content: 'A4サイズ書類が\n入る黒色の鞄を\n用意しておこう' },
  { category: 'job_hunting', content: '時計はシンプルな\nアナログタイプを\n選ぶのが良い' },
  { category: 'job_hunting', content: 'ネクタイは青系か\n赤系の色が好印象\nを与えやすい' },
  { category: 'job_hunting', content: '靴下は黒色か紺色\n無地で丈は長めに\nするのが良い' },
  { category: 'job_hunting', content: 'メイクの基本は\nナチュラルメイク\nにすることだ' },
  { category: 'job_hunting', content: '爪は短く清潔に\n保つことがとても\n大切になる' },
  { category: 'job_hunting', content: '面接の時には\n香水をつけない\nことが原則だ' },
  { category: 'job_hunting', content: 'SPIの対策は\n3ヶ月前から\n始めるのが良い' },
  { category: 'job_hunting', content: '性格検査では\n一貫性を保つ\nように心がける' },
  { category: 'job_hunting', content: '新聞を毎日読む\n習慣をつけて\nおくことが大事' },
  { category: 'job_hunting', content: '企業の理念と\n自分の価値観を\n結びつけて語る' },
  { category: 'job_hunting', content: '自己PRの中には\n具体的な話を\n必ず入れよう' },
  { category: 'job_hunting', content: 'ガクチカでは\n成果よりも過程を\n詳しく語ろう' },
  { category: 'job_hunting', content: '逆質問は最低でも\n3つは事前に\n用意しておく' },
  { category: 'job_hunting', content: '挫折の経験では\n学びを中心にして\n語るのが良い' },
  { category: 'job_hunting', content: '短所を話す時には\n改善策を添えて\n話すようにする' },
  { category: 'job_hunting', content: '入社後3年後\n5年後のビジョンを\n語れるように' },
  { category: 'job_hunting', content: '会場には15分前\n到着することを\n心がけよう' },
  { category: 'job_hunting', content: '受付の対応でも\n丁寧な言葉遣いで\n話すことが大切' },
  { category: 'job_hunting', content: '待合室でも決して\n気を抜かずに\n過ごすようにする' },
  { category: 'job_hunting', content: 'ノックは3回する\nのがビジネスでの\n常識とされている' },
  { category: 'job_hunting', content: 'お辞儀は30度と\n45度の角度を\n使い分けよう' },
  { category: 'job_hunting', content: '着席するのは\n勧められてから\n座るのが礼儀だ' },
  { category: 'job_hunting', content: '面接官の目を\nしっかり見て\n話すようにする' },
  { category: 'job_hunting', content: 'ゆっくり落ち着いて\n話すことを常に\n心がけよう' },
  { category: 'job_hunting', content: 'ハキハキとした\n明るい声で話す\nようにしよう' },
  { category: 'job_hunting', content: '背筋を伸ばして\n手は膝の上に\n置くのが基本だ' },
  { category: 'job_hunting', content: '自然な笑顔で\n好印象を作る\nことが大切だ' },
  { category: 'job_hunting', content: '適度に相槌を打ち\n傾聴の姿勢を\n示すようにする' },
  { category: 'job_hunting', content: '結論から先に話す\n癖をつけておく\nことが重要だ' },
  { category: 'job_hunting', content: '数字を使うことで\n具体的に伝える\n工夫をしよう' },
  { category: 'job_hunting', content: '尊敬語と謙譲語を\n正しく使い分ける\nようにしよう' },
  { category: 'job_hunting', content: '退室するまで\n気を抜かずに\n丁寧に振る舞う' },
  { category: 'job_hunting', content: '面接が終わったら\n24時間以内に\nお礼状を送る' },
  { category: 'job_hunting', content: '電話での応対は\n静かな場所で\nメモを取りながら' },
  { category: 'job_hunting', content: 'メールの件名は\n簡潔で明瞭に\n書くようにする' },
  { category: 'job_hunting', content: '署名の中には\n大学名と学部名を\n必ず入れておく' },
  { category: 'job_hunting', content: '企業からメールは\n24時間以内に\n返信するように' },
  { category: 'job_hunting', content: 'お世話になって\nおりますという\n挨拶が基本だ' },
  { category: 'job_hunting', content: '添付ファイルは\nPDFで送るのが\n一般的とされる' },
  { category: 'job_hunting', content: '日程調整の際は\n複数の候補日を\n提示しよう' },
  { category: 'job_hunting', content: 'OB訪問では\n最低5人には\n話を聞こう' },
  { category: 'job_hunting', content: '訪問する前には\n質問を10個\n考えておこう' },
  { category: 'job_hunting', content: '訪問が終わったら\n必ずお礼メールを\n送るようにする' },
  { category: 'job_hunting', content: '説明会に参加する\n時は前列中央の\n席を狙おう' },
  { category: 'job_hunting', content: '重要なポイントは\n必ずメモを取る\n習慣をつける' },
  { category: 'job_hunting', content: '質問の時間には\n積極的に関心を\n示すようにする' },
  { category: 'job_hunting', content: '名刺は両手で\n受け取り丁寧に\n扱うのが礼儀だ' },
  { category: 'job_hunting', content: '内定を辞退する\n時は電話で誠意を\n持って伝える' },
  { category: 'job_hunting', content: '保留する際には\n正直に状況を\n説明しよう' },
  { category: 'job_hunting', content: '企業が指定した\n期限は必ず守る\nことが大切だ' },
  { category: 'job_hunting', content: '複数の内定が出たら\n比較検討をして\n慎重に決める' },
  { category: 'job_hunting', content: '入社の書類は\n期限厳守で不備\nなく提出する' },
  { category: 'job_hunting', content: '健康診断は指定\nされた期間内に\n受診しよう' },
  { category: 'job_hunting', content: '就活中はSNSの\n投稿内容に注意\nすることが大事' },
  { category: 'job_hunting', content: '飲酒している写真は\nすぐに削除して\nおくようにする' },
  { category: 'job_hunting', content: '本名で検索される\n可能性があると\n考えておこう' },
  { category: 'job_hunting', content: 'SNSでの繋がりを\n見直すことも\n検討しよう' },
  { category: 'job_hunting', content: 'グルディスでは\nまず役割分担を\n決めることから' },
  { category: 'job_hunting', content: '司会の役割は\n全員の意見を\n引き出すこと' },
  { category: 'job_hunting', content: '書記の役割は\n議論を整理しつつ\n記録すること' },
  { category: 'job_hunting', content: '時間配分を適切に\n管理することが\n大切になる' },
  { category: 'job_hunting', content: '発表は簡潔明瞭に\nまとめることを\n心がけよう' },
  { category: 'job_hunting', content: '他者の意見を\nしっかりと聞く\n姿勢が大切だ' },
  { category: 'job_hunting', content: 'チームワークを\n最優先に考えて\n行動しよう' },
  { category: 'job_hunting', content: '根拠を示しながら\n意見を述べる\nようにしよう' },
  { category: 'job_hunting', content: '長期インターンの\n方が評価されやすい\nと言われている' },
  { category: 'job_hunting', content: '学んだことを\n言語化をして\nおくようにする' },
  { category: 'job_hunting', content: '同期との繋がりも\n大切にすることを\n忘れないように' },
  { category: 'job_hunting', content: 'フィードバックを\n次に活かす姿勢を\n持つことが大事' },
  { category: 'job_hunting', content: '最新ニュースを\n毎日チェックする\n習慣をつける' },
  { category: 'job_hunting', content: '志望する業界の\n主要な企業を\n把握しておく' },
  { category: 'job_hunting', content: 'IR情報を見て\n財務状況なども\n確認しておく' },
  { category: 'job_hunting', content: '口コミサイトも\n参考にしながら\n社風を知ろう' },
  { category: 'job_hunting', content: '福利厚生の詳細は\n募集要項を見て\n確認しよう' },
  { category: 'job_hunting', content: '初任給だけでなく\n昇給制度なども\n見ておこう' },
  { category: 'job_hunting', content: '平均的な残業時間を\n質問してみる\nことも大切だ' },
  { category: 'job_hunting', content: '3年後の離職率は\n重要な指標の\n一つとされる' },
  { category: 'job_hunting', content: '育休の取得率や\n復職率なども\n確認しておく' },
  { category: 'job_hunting', content: '昇進の制度や\n評価の基準を\n知っておこう' },
  { category: 'job_hunting', content: '転勤の有無や頻度を\n確認することも\n忘れないように' },
  { category: 'job_hunting', content: '手帳アプリを使い\n予定を一元管理\nするのが良い' },
  { category: 'job_hunting', content: '睡眠時間は最低\n6時間以上は\n確保しよう' },
  { category: 'job_hunting', content: '趣味の時間も大切に\nしてストレスを\n溜めないように' },
  { category: 'job_hunting', content: 'キャリアセンターを\n積極的に活用\nすることが大事' },
  { category: 'job_hunting', content: '就活サイトは複数\n登録しておくと\n便利になる' },
  { category: 'job_hunting', content: '選考の状況は\nエクセルを使って\n管理すると便利' },
  { category: 'job_hunting', content: '交通費の領収書は\n必ず保管をして\nおくようにする' },
  { category: 'job_hunting', content: 'ダブルブッキングに\n注意することを\n忘れないように' },
  { category: 'job_hunting', content: '前日には持ち物を\n必ずチェックする\n習慣をつける' },
  { category: 'job_hunting', content: '失敗は成長のための\n糧だと捉えて\n前向きに進もう' },
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
