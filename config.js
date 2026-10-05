// =====================================================================
//  EDIT HERE: names, texts and options.
//  Everything below is the same text as the desktop version (proposal.py).
//  After editing, save the file. On GitHub, commit it and Vercel redeploys.
// =====================================================================

const HIS_FULL = "ফাহিম ফেরদৌস";
const HIS = "ফাহিম";
const HER_FULL = "মহুয়া রহমান সুচি";
const HER = "সুচি";

window.PROPOSAL_CONFIG = {
  HIS_FULL, HIS, HER_FULL, HER,

  PLAY_MUSIC: true,     // false = no music
  BANGLA_FONT: "",      // e.g. "Kalpurush" or "SolaimanLipi". Empty = choose automatically
  CUSTOM_SONG: "",      // e.g. "song.mp3" (put the file next to index.html). Empty = built-in music box

  // When she taps "Yes", your phone gets a push notification through the free ntfy app.
  // Nothing changes on her screen. In the ntfy app, subscribe to exactly this topic name.
  // Empty "" = no notification. Test without fooling yourself: open your link with ?test at the end.
  NOTIFY_TOPIC: "fahim-yes-3nrq6pd9zn5y",
  NOTIFY_SERVER: "https://ntfy.sh",
  // Notification text. The first line is the bold title, the other lines show under it
  // (followed by the time and how many times she tried to catch the No button).
  NOTIFY_TITLE: `হ্যাঁ ${HIS}, আমিও তোমাকে ভালোবাসি। ❤️🥰
আমি তোমার পরবর্তী প্রজন্মের অংশ হতে চাই। 👩‍❤️‍👨💍
তোমার হাত ধরে বুড়ো হতে চাই। 🫶🏻👴🏻👵🏻
প্রতিটা ভোর দুজন একসাথে শুরু করতে চাই। 🌅❤️
সুখে-দুঃখে সবসময় তোমার সাথে থাকতে চাই, তোমার জীবনসঙ্গী হয়ে। 🥹❤️🫶🏻`,

  // Scenes where the viewer gets the 1x / 1.5x / 2x speed buttons.
  // Possible names: "intro", "names", "book", "song", "poem", "heart", "letter"
  SPEED_SCENES: ["song", "poem"],
  SPEED_OPTIONS: [1, 1.5, 2],

  START_LINE: `${HER}, তোমার জন্য একটা ছোট্ট সারপ্রাইজ আছে...`,
  START_HINT: "শুরু করতে স্ক্রিনের যেকোনো জায়গায় ক্লিক করো",

  INTRO: ["একটা ছোট্ট গল্প বলি?", "যে গল্পের প্রতিটা পাতায় শুধু তুমি..."],

  NAMES_SUB: ["দুটি নাম, একটি হৃদয়", "দুটি পথ, একটি গন্তব্য"],

  BOOK_LINE: "আজ প্রকাশিত হলো একটি বই...",
  BOOK_COVER: ["ভালোবাসার বই", `${HIS} ও ${HER}`, "প্রথম প্রকাশ: আজ, শুধু তোমার জন্য"],
  CHAPTERS: [
    ["প্রথম অধ্যায়", "প্রথম দেখা", [
      "যেদিন তোমাকে প্রথম দেখলাম,",
      "সেদিন বুঝলাম, একটা হাসি",
      "কীভাবে পুরো পৃথিবীটাকে",
      "এক মুহূর্তে বদলে দিতে পারে।"]],
    ["দ্বিতীয় অধ্যায়", "প্রতিদিনের তুমি", [
      "সকালের প্রথম আলোয় তুমি,",
      "ক্লান্ত দুপুরের ছায়ায় তুমি,",
      "রাতের শেষ ভাবনাতেও তুমি।",
      "তুমি আমার প্রতিদিনের অভ্যাস।"]],
    ["শেষ অধ্যায়", "এখনো লেখা হয়নি", [
      "এই অধ্যায়টা আমি একা লিখব না।",
      "এটা লিখব আমরা দুজন মিলে,",
      "সারাজীবন ধরে, একসাথে,",
      "হাতে হাত রেখে।"]],
  ],

  SONG_TITLE: "তোমার জন্য একটা গান",
  SONG_LINES: [
    "তুমি আছো বলে আকাশটা আজ এত নীল,",
    "তুমি আছো বলে বাতাসে ভাসে গান,",
    "তোমার নামেই বাঁধা আমার হৃদয়ের সুর,",
    `${HER}, তুমিই আমার প্রাণ।`,
    "হাজার ভিড়েও খুঁজি শুধু তোমার মুখ,",
    "তোমার হাসিতেই লুকানো আমার সুখ।",
  ],

  POEM_TITLE: "কবিগুরুর ভাষায়",
  POEM_TAGORE: ["তোমারেই যেন ভালোবাসিয়াছি শত রূপে শত বার,",
                "জনমে জনমে, যুগে যুগে অনিবার।"],
  POEM_CREDIT: "রবীন্দ্রনাথ ঠাকুর (অনন্ত প্রেম)",
  POEM_MINE_TITLE: "আর আমার ভাষায়...",
  POEM_MINE: ["শত জনম পরেও যদি আবার আসি ফিরে,",
              `খুঁজে নেব তোমায়, ${HER}, হাজার মানুষের ভিড়ে।`],

  HEART_TEXT: `${HIS} এবং ${HER}`,
  HEART_SUB: "চিরকাল, একসাথে",

  LETTER: [
    ["head", `প্রিয় ${HER},`],
    ["key", "আমি তোমাকে খুব বেশি ভালোবাসি।"],
    ["body", "তোমাকে ছাড়া আমার প্রতিটা দিন অসম্পূর্ণ লাগে।"],
    ["body", "তোমাকে আমার খুব প্রয়োজন, আজ, কাল, সারাজীবন।"],
    ["key", "আমি তোমাকে বিয়ে করতে চাই।"],
    ["body", "আমার পরবর্তী প্রজন্ম আমি তোমার সাথেই শুরু করতে চাই।"],
    ["body", "তোমার হাত ধরে বুড়ো হতে চাই,"],
    ["body", "প্রতিটা ভোর শুরু করতে চাই তোমার মুখ দেখে।"],
    ["body", "সুখে-দুঃখে, রোদে-ঝড়ে, সবসময় আমি তোমার পাশে থাকব।"],
    ["sign", "শুধু তোমারই,"],
    ["sign2", HIS],
  ],

  QUESTION: "তুমিও কি আমাকে ভালোবাসো?",
  QUESTION_SUB: "সত্যি করে বলো...",
  YES_TEXT: "Yes",
  NO_TEXT: "No",
  TEASES: [
    "উঁহু! ওটা ধরা যাবে না।",
    "আরেকবার ভেবে দেখো না, লক্ষ্মীটি...",
    `'না' বলার কোনো সুযোগ নেই, ${HER}!`,
    "আমার হৃদয়টা ভেঙে যাবে তো!",
    "দেখছ? ও নিজেই পালিয়ে যাচ্ছে!",
    "উত্তর তো একটাই, পাশের বাটনটা চাপো!",
    "এত কষ্ট করছ কেন? মন যা বলছে তাই করো।",
    "আমি জানি, তোমার মনও 'হ্যাঁ' বলছে...",
  ],

  CEL_TITLE: "আজ আমার পৃথিবীটা পূর্ণ হলো!",
  CEL_NAMES: `${HIS} + ${HER}`,
  CEL_WISH: ["দুজনে মিলে শুরু করব অনেক সুন্দর একটা ক্যারিয়ার,",
             "গড়ে তুলব সুন্দর একটা সংসার, সুন্দর একটা জীবন।"],
  CEL_LAST: "আমাদের নতুন পথচলা শুভ হোক!",
};
