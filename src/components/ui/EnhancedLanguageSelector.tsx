"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Search, Globe } from "lucide-react";
import { TranslationService } from "@/services/TranslationService";

interface Language {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  type: "spoken" | "signed";
}

interface EnhancedLanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  type: "spoken" | "signed" | "both";
  detectedLanguage?: string | null;
  placeholder?: string;
  className?: string;
  showFlags?: boolean;
  showNativeNames?: boolean;
}

// Comprehensive language data with native names and flags
const languageData: Record<string, Language> = {
  // Spoken languages
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    type: "spoken",
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    type: "spoken",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    type: "spoken",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    type: "spoken",
  },
  it: {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    type: "spoken",
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    type: "spoken",
  },
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    type: "spoken",
  },
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    type: "spoken",
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    type: "spoken",
  },
  ko: {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    type: "spoken",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    type: "spoken",
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    type: "spoken",
  },
  th: {
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    flag: "🇹🇭",
    type: "spoken",
  },
  vi: {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    type: "spoken",
  },
  tr: {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    type: "spoken",
  },
  pl: {
    code: "pl",
    name: "Polish",
    nativeName: "Polski",
    flag: "🇵🇱",
    type: "spoken",
  },
  nl: {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    type: "spoken",
  },
  sv: {
    code: "sv",
    name: "Swedish",
    nativeName: "Svenska",
    flag: "🇸🇪",
    type: "spoken",
  },
  da: {
    code: "da",
    name: "Danish",
    nativeName: "Dansk",
    flag: "🇩🇰",
    type: "spoken",
  },
  no: {
    code: "no",
    name: "Norwegian",
    nativeName: "Norsk",
    flag: "🇳🇴",
    type: "spoken",
  },
  fi: {
    code: "fi",
    name: "Finnish",
    nativeName: "Suomi",
    flag: "🇫🇮",
    type: "spoken",
  },
  cs: {
    code: "cs",
    name: "Czech",
    nativeName: "Čeština",
    flag: "🇨🇿",
    type: "spoken",
  },
  hu: {
    code: "hu",
    name: "Hungarian",
    nativeName: "Magyar",
    flag: "🇭🇺",
    type: "spoken",
  },
  ro: {
    code: "ro",
    name: "Romanian",
    nativeName: "Română",
    flag: "🇷🇴",
    type: "spoken",
  },
  bg: {
    code: "bg",
    name: "Bulgarian",
    nativeName: "Български",
    flag: "🇧🇬",
    type: "spoken",
  },
  hr: {
    code: "hr",
    name: "Croatian",
    nativeName: "Hrvatski",
    flag: "🇭🇷",
    type: "spoken",
  },
  sk: {
    code: "sk",
    name: "Slovak",
    nativeName: "Slovenčina",
    flag: "🇸🇰",
    type: "spoken",
  },
  sl: {
    code: "sl",
    name: "Slovenian",
    nativeName: "Slovenščina",
    flag: "🇸🇮",
    type: "spoken",
  },
  et: {
    code: "et",
    name: "Estonian",
    nativeName: "Eesti",
    flag: "🇪🇪",
    type: "spoken",
  },
  lv: {
    code: "lv",
    name: "Latvian",
    nativeName: "Latviešu",
    flag: "🇱🇻",
    type: "spoken",
  },
  lt: {
    code: "lt",
    name: "Lithuanian",
    nativeName: "Lietuvių",
    flag: "🇱🇹",
    type: "spoken",
  },
  el: {
    code: "el",
    name: "Greek",
    nativeName: "Ελληνικά",
    flag: "🇬🇷",
    type: "spoken",
  },
  he: {
    code: "he",
    name: "Hebrew",
    nativeName: "עברית",
    flag: "🇮🇱",
    type: "spoken",
  },
  fa: {
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    flag: "🇮🇷",
    type: "spoken",
  },
  ur: {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    type: "spoken",
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇧🇩",
    type: "spoken",
  },
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    type: "spoken",
  },
  te: {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    type: "spoken",
  },
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    type: "spoken",
  },
  kn: {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    flag: "🇮🇳",
    type: "spoken",
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    flag: "🇮🇳",
    type: "spoken",
  },
  pa: {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    flag: "🇮🇳",
    type: "spoken",
  },
  mr: {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    type: "spoken",
  },
  ne: {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    flag: "🇳🇵",
    type: "spoken",
  },
  si: {
    code: "si",
    name: "Sinhala",
    nativeName: "සිංහල",
    flag: "🇱🇰",
    type: "spoken",
  },
  my: {
    code: "my",
    name: "Myanmar",
    nativeName: "မြန်မာ",
    flag: "🇲🇲",
    type: "spoken",
  },
  km: {
    code: "km",
    name: "Khmer",
    nativeName: "ខ្មែរ",
    flag: "🇰🇭",
    type: "spoken",
  },
  lo: {
    code: "lo",
    name: "Lao",
    nativeName: "ລາວ",
    flag: "🇱🇦",
    type: "spoken",
  },
  ka: {
    code: "ka",
    name: "Georgian",
    nativeName: "ქართული",
    flag: "🇬🇪",
    type: "spoken",
  },
  hy: {
    code: "hy",
    name: "Armenian",
    nativeName: "Հայերեն",
    flag: "🇦🇲",
    type: "spoken",
  },
  az: {
    code: "az",
    name: "Azerbaijani",
    nativeName: "Azərbaycan",
    flag: "🇦🇿",
    type: "spoken",
  },
  kk: {
    code: "kk",
    name: "Kazakh",
    nativeName: "Қазақша",
    flag: "🇰🇿",
    type: "spoken",
  },
  ky: {
    code: "ky",
    name: "Kyrgyz",
    nativeName: "Кыргызча",
    flag: "🇰🇬",
    type: "spoken",
  },
  uz: {
    code: "uz",
    name: "Uzbek",
    nativeName: "Oʻzbek",
    flag: "🇺🇿",
    type: "spoken",
  },
  tg: {
    code: "tg",
    name: "Tajik",
    nativeName: "Тоҷикӣ",
    flag: "🇹🇯",
    type: "spoken",
  },
  mn: {
    code: "mn",
    name: "Mongolian",
    nativeName: "Монгол",
    flag: "🇲🇳",
    type: "spoken",
  },
  be: {
    code: "be",
    name: "Belarusian",
    nativeName: "Беларуская",
    flag: "🇧🇾",
    type: "spoken",
  },
  uk: {
    code: "uk",
    name: "Ukrainian",
    nativeName: "Українська",
    flag: "🇺🇦",
    type: "spoken",
  },
  mk: {
    code: "mk",
    name: "Macedonian",
    nativeName: "Македонски",
    flag: "🇲🇰",
    type: "spoken",
  },
  sr: {
    code: "sr",
    name: "Serbian",
    nativeName: "Српски",
    flag: "🇷🇸",
    type: "spoken",
  },
  bs: {
    code: "bs",
    name: "Bosnian",
    nativeName: "Bosanski",
    flag: "🇧🇦",
    type: "spoken",
  },
  sq: {
    code: "sq",
    name: "Albanian",
    nativeName: "Shqip",
    flag: "🇦🇱",
    type: "spoken",
  },
  mt: {
    code: "mt",
    name: "Maltese",
    nativeName: "Malti",
    flag: "🇲🇹",
    type: "spoken",
  },
  ga: {
    code: "ga",
    name: "Irish",
    nativeName: "Gaeilge",
    flag: "🇮🇪",
    type: "spoken",
  },
  cy: {
    code: "cy",
    name: "Welsh",
    nativeName: "Cymraeg",
    flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    type: "spoken",
  },
  gd: {
    code: "gd",
    name: "Scottish Gaelic",
    nativeName: "Gàidhlig",
    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    type: "spoken",
  },
  eu: {
    code: "eu",
    name: "Basque",
    nativeName: "Euskera",
    flag: "🇪🇸",
    type: "spoken",
  },
  ca: {
    code: "ca",
    name: "Catalan",
    nativeName: "Català",
    flag: "🇪🇸",
    type: "spoken",
  },
  gl: {
    code: "gl",
    name: "Galician",
    nativeName: "Galego",
    flag: "🇪🇸",
    type: "spoken",
  },
  is: {
    code: "is",
    name: "Icelandic",
    nativeName: "Íslenska",
    flag: "🇮🇸",
    type: "spoken",
  },
  fo: {
    code: "fo",
    name: "Faroese",
    nativeName: "Føroyskt",
    flag: "🇫🇴",
    type: "spoken",
  },
  lb: {
    code: "lb",
    name: "Luxembourgish",
    nativeName: "Lëtzebuergesch",
    flag: "🇱🇺",
    type: "spoken",
  },
  fy: {
    code: "fy",
    name: "Frisian",
    nativeName: "Frysk",
    flag: "🇳🇱",
    type: "spoken",
  },
  af: {
    code: "af",
    name: "Afrikaans",
    nativeName: "Afrikaans",
    flag: "🇿🇦",
    type: "spoken",
  },
  zu: {
    code: "zu",
    name: "Zulu",
    nativeName: "isiZulu",
    flag: "🇿🇦",
    type: "spoken",
  },
  xh: {
    code: "xh",
    name: "Xhosa",
    nativeName: "isiXhosa",
    flag: "🇿🇦",
    type: "spoken",
  },
  st: {
    code: "st",
    name: "Sotho",
    nativeName: "Sesotho",
    flag: "🇿🇦",
    type: "spoken",
  },
  sn: {
    code: "sn",
    name: "Shona",
    nativeName: "chiShona",
    flag: "🇿🇼",
    type: "spoken",
  },
  sw: {
    code: "sw",
    name: "Swahili",
    nativeName: "Kiswahili",
    flag: "🇹🇿",
    type: "spoken",
  },
  rw: {
    code: "rw",
    name: "Kinyarwanda",
    nativeName: "Ikinyarwanda",
    flag: "🇷🇼",
    type: "spoken",
  },
  am: {
    code: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
    flag: "🇪🇹",
    type: "spoken",
  },
  ha: {
    code: "ha",
    name: "Hausa",
    nativeName: "Hausa",
    flag: "🇳🇬",
    type: "spoken",
  },
  ig: {
    code: "ig",
    name: "Igbo",
    nativeName: "Igbo",
    flag: "🇳🇬",
    type: "spoken",
  },
  yo: {
    code: "yo",
    name: "Yoruba",
    nativeName: "Yorùbá",
    flag: "🇳🇬",
    type: "spoken",
  },
  so: {
    code: "so",
    name: "Somali",
    nativeName: "Soomaali",
    flag: "🇸🇴",
    type: "spoken",
  },
  mg: {
    code: "mg",
    name: "Malagasy",
    nativeName: "Malagasy",
    flag: "🇲🇬",
    type: "spoken",
  },
  ny: {
    code: "ny",
    name: "Chichewa",
    nativeName: "Chichewa",
    flag: "🇲🇼",
    type: "spoken",
  },
  ms: {
    code: "ms",
    name: "Malay",
    nativeName: "Bahasa Melayu",
    flag: "🇲🇾",
    type: "spoken",
  },
  id: {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    type: "spoken",
  },
  tl: {
    code: "tl",
    name: "Filipino",
    nativeName: "Filipino",
    flag: "🇵🇭",
    type: "spoken",
  },
  ceb: {
    code: "ceb",
    name: "Cebuano",
    nativeName: "Cebuano",
    flag: "🇵🇭",
    type: "spoken",
  },
  haw: {
    code: "haw",
    name: "Hawaiian",
    nativeName: "ʻŌlelo Hawaiʻi",
    flag: "🇺🇸",
    type: "spoken",
  },
  mi: {
    code: "mi",
    name: "Maori",
    nativeName: "Te Reo Māori",
    flag: "🇳🇿",
    type: "spoken",
  },
  jv: {
    code: "jv",
    name: "Javanese",
    nativeName: "Basa Jawa",
    flag: "🇮🇩",
    type: "spoken",
  },
  su: {
    code: "su",
    name: "Sundanese",
    nativeName: "Basa Sunda",
    flag: "🇮🇩",
    type: "spoken",
  },
  sm: {
    code: "sm",
    name: "Samoan",
    nativeName: "Gagana Samoa",
    flag: "🇼🇸",
    type: "spoken",
  },
  eo: {
    code: "eo",
    name: "Esperanto",
    nativeName: "Esperanto",
    flag: "🌍",
    type: "spoken",
  },
  la: {
    code: "la",
    name: "Latin",
    nativeName: "Latina",
    flag: "🇻🇦",
    type: "spoken",
  },
  co: {
    code: "co",
    name: "Corsican",
    nativeName: "Corsu",
    flag: "🇫🇷",
    type: "spoken",
  },
  ku: {
    code: "ku",
    name: "Kurdish",
    nativeName: "Kurdî",
    flag: "🏴",
    type: "spoken",
  },
  yi: {
    code: "yi",
    name: "Yiddish",
    nativeName: "ייִדיש",
    flag: "🇮🇱",
    type: "spoken",
  },
  ht: {
    code: "ht",
    name: "Haitian Creole",
    nativeName: "Kreyòl Ayisyen",
    flag: "🇭🇹",
    type: "spoken",
  },
  ps: {
    code: "ps",
    name: "Pashto",
    nativeName: "پښتو",
    flag: "🇦🇫",
    type: "spoken",
  },
  sd: {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    flag: "🇵🇰",
    type: "spoken",
  },
  ug: {
    code: "ug",
    name: "Uyghur",
    nativeName: "ئۇيغۇرچە",
    flag: "🇨🇳",
    type: "spoken",
  },
  hmn: {
    code: "hmn",
    name: "Hmong",
    nativeName: "Hmoob",
    flag: "🇱🇦",
    type: "spoken",
  },

  // Sign Languages
  ase: {
    code: "ase",
    name: "American Sign Language",
    nativeName: "ASL",
    flag: "🇺🇸",
    type: "signed",
  },
  asl: {
    code: "asl",
    name: "American Sign Language (ASL)",
    nativeName: "ASL",
    flag: "🇺🇸",
    type: "signed",
  },
  gsg: {
    code: "gsg",
    name: "German Sign Language",
    nativeName: "DGS",
    flag: "🇩🇪",
    type: "signed",
  },
  fsl: {
    code: "fsl",
    name: "French Sign Language",
    nativeName: "LSF",
    flag: "🇫🇷",
    type: "signed",
  },
  bfi: {
    code: "bfi",
    name: "British Sign Language",
    nativeName: "BSL",
    flag: "🇬🇧",
    type: "signed",
  },
  ils: {
    code: "ils",
    name: "Israeli Sign Language",
    nativeName: "ISL",
    flag: "🇮🇱",
    type: "signed",
  },
  sgg: {
    code: "sgg",
    name: "Swiss German Sign Language",
    nativeName: "DSGS",
    flag: "🇨🇭",
    type: "signed",
  },
  ssr: {
    code: "ssr",
    name: "Swiss-Italian Sign Language",
    nativeName: "LIS-SI",
    flag: "🇨🇭",
    type: "signed",
  },
  slf: {
    code: "slf",
    name: "Swiss-French Sign Language",
    nativeName: "LSF-SR",
    flag: "🇨🇭",
    type: "signed",
  },
  jsl: {
    code: "jsl",
    name: "Japanese Sign Language",
    nativeName: "JSL",
    flag: "🇯🇵",
    type: "signed",
  },
  csl: {
    code: "csl",
    name: "Chinese Sign Language",
    nativeName: "CSL",
    flag: "🇨🇳",
    type: "signed",
  },
  bzs: {
    code: "bzs",
    name: "Brazilian Sign Language",
    nativeName: "Libras",
    flag: "🇧🇷",
    type: "signed",
  },
  rsl: {
    code: "rsl",
    name: "Russian Sign Language",
    nativeName: "РЖЯ",
    flag: "🇷🇺",
    type: "signed",
  },
  swl: {
    code: "swl",
    name: "Swedish Sign Language",
    nativeName: "SSL",
    flag: "🇸🇪",
    type: "signed",
  },
  dsl: {
    code: "dsl",
    name: "Danish Sign Language",
    nativeName: "DSL",
    flag: "🇩🇰",
    type: "signed",
  },
  fse: {
    code: "fse",
    name: "Finnish Sign Language",
    nativeName: "FinSL",
    flag: "🇫🇮",
    type: "signed",
  },
  nzs: {
    code: "nzs",
    name: "New Zealand Sign Language",
    nativeName: "NZSL",
    flag: "🇳🇿",
    type: "signed",
  },
  asq: {
    code: "asq",
    name: "Austrian Sign Language",
    nativeName: "ÖGS",
    flag: "🇦🇹",
    type: "signed",
  },
  csq: {
    code: "csq",
    name: "Croatian Sign Language",
    nativeName: "HZJ",
    flag: "🇭🇷",
    type: "signed",
  },
  cse: {
    code: "cse",
    name: "Czech Sign Language",
    nativeName: "ČZJ",
    flag: "🇨🇿",
    type: "signed",
  },
  eso: {
    code: "eso",
    name: "Estonian Sign Language",
    nativeName: "EViK",
    flag: "🇪🇪",
    type: "signed",
  },
  gss: {
    code: "gss",
    name: "Greek Sign Language",
    nativeName: "ΕΝΓ",
    flag: "🇬🇷",
    type: "signed",
  },
  icl: {
    code: "icl",
    name: "Icelandic Sign Language",
    nativeName: "ÍTM",
    flag: "🇮🇸",
    type: "signed",
  },
  ise: {
    code: "ise",
    name: "Irish Sign Language",
    nativeName: "ISL",
    flag: "🇮🇪",
    type: "signed",
  },
  lsl: {
    code: "lsl",
    name: "Latvian Sign Language",
    nativeName: "LZV",
    flag: "🇱🇻",
    type: "signed",
  },
  lls: {
    code: "lls",
    name: "Lithuanian Sign Language",
    nativeName: "LGK",
    flag: "🇱🇹",
    type: "signed",
  },
  psc: {
    code: "psc",
    name: "Polish Sign Language",
    nativeName: "PJM",
    flag: "🇵🇱",
    type: "signed",
  },
  psr: {
    code: "psr",
    name: "Portuguese Sign Language",
    nativeName: "LGP",
    flag: "🇵🇹",
    type: "signed",
  },
  rms: {
    code: "rms",
    name: "Romanian Sign Language",
    nativeName: "LSR",
    flag: "🇷🇴",
    type: "signed",
  },
  svk: {
    code: "svk",
    name: "Slovak Sign Language",
    nativeName: "SZJ",
    flag: "🇸🇰",
    type: "signed",
  },
  aed: {
    code: "aed",
    name: "Argentine Sign Language",
    nativeName: "LSA",
    flag: "🇦🇷",
    type: "signed",
  },
  csg: {
    code: "csg",
    name: "Chilean Sign Language",
    nativeName: "LSCh",
    flag: "🇨🇱",
    type: "signed",
  },
  csf: {
    code: "csf",
    name: "Colombian Sign Language",
    nativeName: "LSC",
    flag: "🇨🇴",
    type: "signed",
  },
  mfs: {
    code: "mfs",
    name: "Mexican Sign Language",
    nativeName: "LSM",
    flag: "🇲🇽",
    type: "signed",
  },
  tsm: {
    code: "tsm",
    name: "Turkish Sign Language",
    nativeName: "TİD",
    flag: "🇹🇷",
    type: "signed",
  },
  ukl: {
    code: "ukl",
    name: "Ukrainian Sign Language",
    nativeName: "УЖМ",
    flag: "🇺🇦",
    type: "signed",
  },
  pks: {
    code: "pks",
    name: "Pakistani Sign Language",
    nativeName: "PSL",
    flag: "🇵🇰",
    type: "signed",
  },
  ins: {
    code: "ins",
    name: "Indonesian Sign Language",
    nativeName: "BISINDO",
    flag: "🇮🇩",
    type: "signed",
  },
  isr: {
    code: "isr",
    name: "Indian Sign Language",
    nativeName: "ISL",
    flag: "🇮🇳",
    type: "signed",
  },
  ssp: {
    code: "ssp",
    name: "Spanish Sign Language",
    nativeName: "LSE",
    flag: "🇪🇸",
    type: "signed",
  },
  jos: {
    code: "jos",
    name: "Jordanian Sign Language",
    nativeName: "LIU",
    flag: "🇯🇴",
    type: "signed",
  },
  "rsl-by": {
    code: "rsl-by",
    name: "Belarusian Sign Language",
    nativeName: "БЖМ",
    flag: "🇧🇾",
    type: "signed",
  },
  bqn: {
    code: "bqn",
    name: "Bulgarian Sign Language",
    nativeName: "БЖЕ",
    flag: "🇧🇬",
    type: "signed",
  },
  "gss-cy": {
    code: "gss-cy",
    name: "Cyprus Sign Language",
    nativeName: "ΚΝΓ",
    flag: "🇨🇾",
    type: "signed",
  },
};

export default function EnhancedLanguageSelector({
  value,
  onChange,
  type,
  detectedLanguage,
  className = "",
  showFlags = true,
  showNativeNames = true,
}: EnhancedLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const availableLanguages = useMemo(() => {
    let languages: Language[] = [];

    if (type === "spoken" || type === "both") {
      languages = languages.concat(
        TranslationService.spokenLanguages
          .map(
            (code) =>
              languageData[code] || {
                code,
                name: TranslationService.getLanguageName(code),
                type: "spoken" as const,
              }
          )
          .filter((lang) => lang.type === "spoken")
      );
    }

    if (type === "signed" || type === "both") {
      languages = languages.concat(
        TranslationService.signedLanguages
          .map(
            (code) =>
              languageData[code] || {
                code,
                name: TranslationService.getLanguageName(code),
                type: "signed" as const,
              }
          )
          .filter((lang) => lang.type === "signed")
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      languages = languages.filter(
        (lang) =>
          lang.name.toLowerCase().includes(query) ||
          lang.code.toLowerCase().includes(query) ||
          (lang.nativeName && lang.nativeName.toLowerCase().includes(query))
      );
    }

    // Sort: detected language first, then alphabetically
    return languages.sort((a, b) => {
      if (detectedLanguage && a.code === detectedLanguage) return -1;
      if (detectedLanguage && b.code === detectedLanguage) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [type, searchQuery, detectedLanguage]);

  const selectedLanguage = useMemo(() => {
    return (
      languageData[value] || {
        code: value,
        name: TranslationService.getLanguageName(value),
        type: "spoken" as const,
      }
    );
  }, [value]);

  const handleLanguageSelect = (languageCode: string) => {
    onChange(languageCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-left bg-background border border-input rounded-lg hover:border-input/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        data-sign-text="language selector"
        data-sign-category="dropdown"
        data-sign-description={`Select ${type} language - currently ${selectedLanguage.name}`}
        aria-label={`Select ${type} language`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showFlags && selectedLanguage.flag && (
            <span className="text-lg flex-shrink-0">
              {selectedLanguage.flag}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground truncate">
              {selectedLanguage.name}
              {detectedLanguage === value && (
                <span className="ml-2 text-xs text-primary">(Detected)</span>
              )}
            </div>
            {showNativeNames &&
              selectedLanguage.nativeName &&
              selectedLanguage.nativeName !== selectedLanguage.name && (
                <div className="text-sm text-muted-foreground truncate">
                  {selectedLanguage.nativeName}
                </div>
              )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                autoFocus
                data-sign-text="search"
                data-sign-category="input"
                data-sign-description="Search for languages in the list"
                aria-label="Search languages"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {availableLanguages.length > 0 ? (
              availableLanguages.map((language) => {
                const isDisabled =
                  language.type === "spoken"
                    ? language.code !== "en"
                    : language.code !== "ase" && language.code !== "asl";
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() =>
                      !isDisabled && handleLanguageSelect(language.code)
                    }
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      value === language.code ? "bg-primary/10" : ""
                    } ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-secondary"
                    }`}
                    data-sign-text={language.name.toLowerCase()}
                    data-sign-category="dropdown"
                    data-sign-description={`Select ${language.name} language`}
                    aria-label={`Select ${language.name}`}
                  >
                    {showFlags && language.flag && (
                      <span className="text-lg flex-shrink-0">
                        {language.flag}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium truncate ${
                          value === language.code
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {language.name}
                        {detectedLanguage === language.code && (
                          <span className="ml-2 text-xs text-primary">
                            (Detected)
                          </span>
                        )}
                        <span className="ml-2 text-xs text-muted-foreground uppercase">
                          {language.type}
                        </span>
                        {isDisabled && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Disabled)
                          </span>
                        )}
                      </div>
                      {showNativeNames &&
                        language.nativeName &&
                        language.nativeName !== language.name && (
                          <div className="text-sm text-muted-foreground truncate">
                            {language.nativeName}
                          </div>
                        )}
                    </div>
                    {value === language.code && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No languages found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
