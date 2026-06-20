import 'dotenv/config';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const YT_KEY = process.env.YOUTUBE_API_KEY;

const COUNTRIES = ["US","GB","JP","KR","DE","FR","ES","IT","BR","MX","IN","ID","CA","AU","RU","VN"];

// 수집할 카테고리 (유튜브 공식 카테고리 ID)
// 23=코미디, 15=동물, 26=하우투/스타일, 22=인물블로그, 27=교육, 24=엔터테인먼트, 1=영화/애니
const CATEGORIES = [
  { id: "23", key: "comedy",   label: "코미디" },
  { id: "15", key: "animals",  label: "동물" },
  { id: "26", key: "howto",    label: "하우투·스타일" },
  { id: "22", key: "people",   label: "인물·블로그" },
  { id: "27", key: "education", label: "교육" },
  { id: "24", key: "ent",      label: "엔터테인먼트" },
  { id: "1",  key: "film",     label: "영화·애니" }
];

const DAILY_LIMIT = 10000;
const STOP_AT = 9000;
const COST_PER_CALL = 1;
const QUOTA_FILE = './quota.json';

function ptDateStr(){
  const now = new Date();
  const pt = new Date(now.getTime() - 8 * 3600 * 1000);
  return pt.toISOString().slice(0,10);
}

function loadQuota(){
  const today = ptDateStr();
  if(existsSync(QUOTA_FILE)){
    try{
      const q = JSON.parse(readFileSync(QUOTA_FILE,'utf8'));
      if(q.date === today) return q;
    }catch(e){}
  }
  return { date: today, used: 0 };
}

function saveQuota(q){ writeFileSync(QUOTA_FILE, JSON.stringify(q)); }

function parseViews(n){ return parseInt(n || "0", 10); }

// 한 국가 + (선택)카테고리의 인기영상
async function fetchPopular(code, categoryId){
  let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics`
    + `&chart=mostPopular&regionCode=${code}&maxResults=50&key=${YT_KEY}`;
  if(categoryId) url += `&videoCategoryId=${categoryId}`;
  const res = await fetch(url);
  const data = await res.json();
  if(data.error){ throw new Error(`${code}${categoryId?'/'+categoryId:''}: ${data.error.message}`); }
  return (data.items || []).map((v, i) => ({
    video_id: v.id,
    title: v.snippet?.title || "",
    channel: v.snippet?.channelTitle || "",
    thumbnail_url: v.snippet?.thumbnails?.medium?.url || "",
    view_count: parseViews(v.statistics?.viewCount),
    country_code: code,
    rank: i + 1,
    youtube_url: `https://www.youtube.com/watch?v=${v.id}`
  }));
}

async function main(){
  const quota = loadQuota();
  // 예상 사용량: 국가별 전체(16) + 국가×카테고리(16×5=80) = 96
  const willUse = COUNTRIES.length * (1 + CATEGORIES.length);

  console.log(`\n오늘(PT ${quota.date}) 사용량: ${quota.used} / ${DAILY_LIMIT} units`);
  console.log(`이번 수집 예상: ${willUse} units (16개국 x (전체1 + 카테고리${CATEGORIES.length}))\n`);

  if(quota.used + willUse > STOP_AT){
    console.log(`[중단] 오늘 사용량이 안전선(${STOP_AT})을 넘게 됩니다.`);
    console.log(`   quota.json 파일을 지우면 카운터가 초기화됩니다.\n`);
    process.exit(0);
  }

  let usedThisRun = 0;
  // 결과 구조: { country:{US:[...]}, category:{music:{US:[...]}}, global:[...] }
  const result = { country:{}, category:{}, global:[] };
  let allForGlobal = [];

  // 1) 국가별 전체 인기
  for(const code of COUNTRIES){
    try{
      const rows = await fetchPopular(code, null);
      usedThisRun++;
      result.country[code] = rows;
      allForGlobal = allForGlobal.concat(rows.map(r=>({...r, country_code:code})));
      console.log(`OK [전체] ${code}: ${rows.length}`);
    }catch(e){
      usedThisRun++;
      console.log(`FAIL [전체] ${e.message}`);
    }
  }

  // 2) 카테고리별 인기 (국가별)
  for(const cat of CATEGORIES){
    result.category[cat.key] = {};
    for(const code of COUNTRIES){
      try{
        const rows = await fetchPopular(code, cat.id);
        usedThisRun++;
        result.category[cat.key][code] = rows;
        console.log(`OK [${cat.label}] ${code}: ${rows.length}`);
      }catch(e){
        usedThisRun++;
        // 일부 국가는 특정 카테고리 미지원 — 조용히 건너뜀
        result.category[cat.key][code] = [];
      }
    }
  }

  // 3) 전세계 통합(global): 전체 인기에서 조회수 상위 30
  const seen = new Set();
  result.global = [...allForGlobal]
    .sort((a,b)=> b.view_count - a.view_count)
    .filter(v => { if(seen.has(v.video_id)) return false; seen.add(v.video_id); return true; })
    .slice(0,100)
    .map((v,i)=> ({...v, rank:i+1}));

  const out = {
    fetched_at: new Date().toISOString(),
    countries: COUNTRIES,
    categories: CATEGORIES.map(c=>({key:c.key, label:c.label})),
    data: result
  };
  writeFileSync('./data.json', JSON.stringify(out, null, 2));

  quota.used += usedThisRun;
  saveQuota(quota);

  const remaining = DAILY_LIMIT - quota.used;

  console.log(`\n------------------------------`);
  console.log(`이번 실행 사용량 : ${usedThisRun} units`);
  console.log(`오늘 누적 사용량 : ${quota.used} / ${DAILY_LIMIT} units`);
  console.log(`추정 잔여량      : 약 ${remaining} units`);
  console.log(`------------------------------`);
  console.log(`\n완료: data.json 저장됨 (전체 + 카테고리 ${CATEGORIES.length}종 x 16개국)`);
}

main();
