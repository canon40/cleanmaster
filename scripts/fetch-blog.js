// 네이버 블로그 RSS를 읽어 blog.json 으로 저장하고, 글마다 대표 사진을 blogimg/ 에 내려받습니다.
// GitHub Actions 가 주기적으로 실행합니다.
const fs = require('fs');
const BLOG_ID = 'jangsang40';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' };

// 제목에 들어 있는 낱말로 분류합니다. 위에서부터 먼저 맞는 분류가 선택됩니다.
const CATS = [
  ['에어컨청소', /에어컨|실외기|냉난방기/],
  ['카펫크리닝', /카펫|카페트|의자\s*청소|객석/],
  ['줄눈시공', /줄눈/],
  ['외벽·유리청소', /외벽|유리창|유리\s*청소/],
  ['화재청소', /화재|그을음/],
  ['석재관리', /연마|도끼다시|테라조|대리석|화강석|석재|폴리싱|면갈이|광택/],
  ['특수청소', /본드|기름때|에폭시|우레탄|백화|녹물|페인트|스티커|물청소|주차장/],
  ['바닥왁스코팅', /왁스|코팅|데코타일|디럭스타일|포세린|마루|박리|바퀴자국/],
  ['오피스크리닝', /사무실|오피스|학교|교실|학원|매장|식당|병원|준공|입주|원상복구|청소/],
];
const classify = (t) => (CATS.find(([, re]) => re.test(t)) || ['소식'])[0];

function pick(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim() : '';
}
function clean(s) {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
async function cover(logNo) {
  const file = 'blogimg/' + logNo + '.jpg';
  if (fs.existsSync(file) && fs.statSync(file).size > 2000) return file;
  try {
    const r = await fetch('https://m.blog.naver.com/' + BLOG_ID + '/' + logNo, { headers: UA });
    if (!r.ok) return '';
    const html = await r.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ||
              html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/);
    if (!m) return '';
    let url = m[1].replace(/&amp;/g, '&');
    if (!/^https:\/\/[a-z0-9.-]+\.(pstatic\.net|naver\.net|naver\.com)\//.test(url)) return '';
    if (/blogpfthumb|profile|og_default|static\.blog/.test(url)) return ''; // 프로필·기본 이미지는 제외
    url = url.replace(/([?&])type=[^&]+/, '$1type=w800');
    const ir = await fetch(url, { headers: { ...UA, Referer: 'https://m.blog.naver.com/' } });
    if (!ir.ok || !/^image\//.test(ir.headers.get('content-type') || '')) return '';
    const buf = Buffer.from(await ir.arrayBuffer());
    if (buf.length < 2000 || buf.length > 3000000) return '';
    fs.mkdirSync('blogimg', { recursive: true });
    fs.writeFileSync(file, buf);
    return file;
  } catch (e) { return ''; }
}
(async () => {
  const r = await fetch('https://rss.blog.naver.com/' + BLOG_ID + '.xml', { headers: UA });
  if (!r.ok) throw new Error('RSS ' + r.status);
  const xml = await r.text();
  const posts = [];
  for (const it of xml.match(/<item>[\s\S]*?<\/item>/g) || []) {
    const title = clean(pick(it, 'title'));
    const link = pick(it, 'link').split('?')[0];
    const logNo = (link.match(/\/(\d{6,})$/) || [])[1];
    if (!title || !logNo) continue;
    const d = new Date(pick(it, 'pubDate'));
    posts.push({
      title, link,
      date: isNaN(d) ? '' : new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, '.'),
      cat: classify(title),
      summary: clean(pick(it, 'description')).slice(0, 160),
      img: await cover(logNo),
    });
  }
  if (!posts.length) throw new Error('no posts');
  fs.writeFileSync('blog.json', JSON.stringify({ blog: BLOG_ID, updated: new Date().toISOString(), posts }, null, 1));
  console.log('posts:', posts.length, 'with image:', posts.filter((p) => p.img).length);
})().catch((e) => { console.error(e); process.exit(1); });
