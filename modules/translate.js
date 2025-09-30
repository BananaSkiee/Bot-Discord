// modules/translate.js
const translate = require('@vitalets/google-translate-api');

const languageMap = {
  id: { name: "Indonesian", flag: "🇮🇩" },
  en: { name: "English", flag: "🇬🇧" },
  jp: { name: "Japanese", flag: "🇯🇵" },
  fr: { name: "French", flag: "🇫🇷" },
  es: { name: "Spanish", flag: "🇪🇸" },
  de: { name: "German", flag: "🇩🇪" },
  ru: { name: "Russian", flag: "🇷🇺" },
  zh: { name: "Chinese", flag: "🇨🇳" },
  ar: { name: "Arabic", flag: "🇸🇦" },
  ko: { name: "Korean", flag: "🇰🇷" },
  hi: { name: "Hindi", flag: "🇮🇳" },
  it: { name: "Italian", flag: "🇮🇹" },
  th: { name: "Thai", flag: "🇹🇭" },
  pt: { name: "Portuguese", flag: "🇵🇹" }
};

module.exports = async function translateHandler(message) {
  const prefixRegex = /^([a-z]{2})!\s*(.+)/i;
  const match = message.content.match(prefixRegex);

  if (!match) return;

  const targetLang = match[1].toLowerCase();
  const text = match[2];

  if (!languageMap[targetLang]) return;

  try {
    const res = await translate(text, { to: targetLang });

    const sourceLang = res.from.language.iso;
    const sourceLangName = languageMap[sourceLang]?.name || sourceLang.toUpperCase();
    const targetLangName = languageMap[targetLang].name;
    const flag = languageMap[targetLang].flag;

    await message.reply({
      content: `${flag} **Translated (${sourceLangName} → ${targetLangName}):**\n${res.text}`,
    });
  } catch (err) {
    console.error("❌ Translate error:", err);
    message.reply("❌ Gagal menerjemahkan. Coba lagi nanti.");
  }
};
