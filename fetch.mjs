// 휴마텍 컨텐츠 스카우터 - 자동 수집기 (Supabase 저장 버전)
import { createClient } from '@supabase/supabase-js';

const YT_KEY = process.env.YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!YT_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[중단] 환경변수(YOUTUBE_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_KEY)가 없습니다.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const COUNTRIES = [
  { code: "US", continent: "namerica" }, { code: "CA", continent: "namerica" }, { code: "MX", continent: "namerica" },
  { code: "GB", continent: "europe" },   { code: "DE", continent: "europe" },   { code: "FR", continent: "europe" },
  { code: "ES", continent: "europe" },   { code: "IT", continent: "europe" },   { code: "RU", continent: "europe" },
  { code: "JP", continent: "asia" },     { code: "KR", continent: "asia" },     { code: "IN", continent: "asia" },
  { code: "ID", continent: "asia" },     { code: "VN", continent: "asia" },
  { code: "BR", continent: "samerica" },
  { code: "AU", continent: "oceania" }
];

const CATEGORIES = [
  { id: "10", key: "music" },   { id: "23", key: "comedy" },   { id: "15", key: "animals" },
  { id: "26", key: "howto" },   { id: "22", key: "people" },   { id: "27", key: "education" },
  { id: "24", key: "ent" },     { id: "1",  key: "film" },     { id: "17", key: "sports" },
  { id: "25", key: "news" },    { id: "28", key: "science" },  { id: "20", key: "gaming" },
  { id: "19", key: "travel" },  { id: "2",  key: "autos" }
];

const continentOf = (code) => (COUNTRIES.find(c => c.code === code) || {}).continent || null;
function parseNum(n){ return parseInt(n || "0", 10); }

// 유튜브 공식 categoryId(숫자) → 우리 카테고리 키 매핑
const CATEGORY_ID_TO_KEY = {
  "10":"music", "23":"comedy", "15":"animals", "26":"howto", "22":"people",
  "27":"education", "24":"ent", "1":"film", "17":"sports", "25":"news",
  "28":"science", "20":"gaming", "19":"travel", "2":"autos"
};
const trueCategoryOf = (v) => CATEGORY_ID_TO_KEY[v.snippet?.categoryId] || null;

function toRow(v, i, code, categoryKey, license){
  return {
    video_id: v.id,
    title: v.snippet?.title || "",
    channel: v.snippet?.channelTitle || "",
    channel_id: v.snippet?.channelId || "",
    published_at: v.snippet?.publishedAt || null,
    thumbnail_url: v.snippet?.thumbnails?.medium?.url || "",
    view_count: parseNum(v.statistics?.viewCount),
    like_count: parseNum(v.statistics?.likeCount),
    comment_count: parseNum(v.statistics?.commentCount),
    country_code: code,
    continent: code === "GLOBAL" ? null : continentOf(code),
    category_key: categoryKey,
    true_category: trueCategoryOf(v),
    license: license,
    rank: i + 1,
    youtube_url: `https://www.youtube.com/watch?v=${v.id}`
  };
}

async function fetchPopular(code, categoryId){
  let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics`
    + `&chart=mostPopular&regionCode=${code}&maxResults=50&key=${YT_KEY}`;
  if (categoryId) url += `&videoCategoryId=${categoryId}`;
