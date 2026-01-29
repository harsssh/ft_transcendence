// ============================================================================
// Configuration - 数値は後から変えられるように宣言的に設定
// ============================================================================

export const CONFIG = {
  // 総ユーザー数
  totalUsers: 10000,
  defaultPassword: 'password',

  // ユーザータイプの割合
  userTypeRatios: {
    loneWolf: 0.01, // 一匹狼: 1%
    minimalist: 0.09, // ミニマリスト: 9%
    beginner: 0.54, // 初心者: 54%
    average: 0.25, // 凡人: 25%
    gamer: 0.1, // ゲーマー: 10%
    heavyUser: 0.01, // ヘビーユーザー: 1%
  },

  // 各ユーザータイプの詳細設定
  userTypes: {
    loneWolf: {
      friendCount: 0,
      friendGuilds: 0,
      mediumGuilds: 0,
      largeGuilds: 0,
      hasDMs: false,
    },
    minimalist: {
      friendCount: 10,
      friendGuilds: 0,
      mediumGuilds: 0,
      largeGuilds: 0,
      hasDMs: true, // フレンド全員とDM
    },
    beginner: {
      friendCount: -1, // 友達サーバーメンバー全員とフレンド
      friendGuilds: 2,
      mediumGuilds: 0,
      largeGuilds: 1,
      hasDMs: true,
    },
    average: {
      friendCount: 30,
      friendGuilds: 5,
      mediumGuilds: 3,
      largeGuilds: 2,
      hasDMs: false,
    },
    gamer: {
      friendCount: 100,
      friendGuilds: 10,
      mediumGuilds: 5,
      largeGuilds: 10,
      hasDMs: false,
    },
    heavyUser: {
      friendCount: 1000,
      friendGuilds: 100,
      mediumGuilds: 10,
      largeGuilds: 100,
      hasDMs: false,
    },
  },

  // ギルドタイプの設定
  guildTypes: {
    friend: {
      minMembers: 3,
      maxMembers: 9,
    },
    medium: {
      minMembers: 800,
      maxMembers: 1200,
    },
    large: {
      minMembers: 8000,
      maxMembers: 12000,
    },
  },

  // メッセージ設定
  messages: {
    minPerChannel: 0,
    maxPerChannel: 100,
  },

  // ギルドあたりのチャンネル数
  channelsPerGuild: {
    friend: { min: 1, max: 3 },
    medium: { min: 5, max: 15 },
    large: { min: 10, max: 30 },
  },

  // テーブルごとのバッチサイズ
  batchSize: {
    users: 10000,
    guilds: 10000,
    guildMembers: 10000,
    channels: 10000,
    friendships: 10000,
    usersToChannels: 10000,
    messages: 10000,
  },

  // メッセージテンプレート
  messageTemplates: [
    'Hello!',
    'How are you?',
    'Nice to meet you!',
    'What do you think?',
    'I agree!',
    'Interesting point.',
    'Let me think about that.',
    'Thanks for sharing!',
    'Great idea!',
    'I see.',
    'Sure!',
    'No problem.',
    'Sounds good!',
    'Let me know.',
    'Got it!',
    'こんにちは',
    'お元気ですか？',
    'はじめまして',
    'どう思いますか？',
    '同感です！',
    '面白いポイントですね。',
    '考えさせてください。',
    '共有してくれてありがとう！',
    '素晴らしいアイデア！',
    'なるほど。',
    'もちろん！',
    '問題ありません。',
    'いいですね！',
    '教えてください。',
    '了解です！',
  ],
} as const
