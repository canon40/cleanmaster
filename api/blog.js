// Vercel 서버리스 함수: 네이버 블로그 RSS를 읽어 최신 글 목록을 JSON으로 돌려줍니다.
const BLOG_ID = 'jangsang40';

function pick(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  if (!m) return '';
  return m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
}
function clean(s) {
  return s.replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
function parse(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return items.slice(0, 9).map((it) => {
    const d = new Date(pick(it, 'pubDate'));
    const date = isNaN(d) ? '' : d.toISOString().slice(0, 10).replace(/-/g, '.');
    return {
      title: clean(pick(it, 'title')),
      link: pick(it, 'link').split('?')[0],
      date,
      summary: clean(pick(it, 'description')).slice(0, 140),
      category: clean(pick(it, 'category')),
    };
  }).filter((p) => p.title && p.link);
}

module.exports = async (req, res) => {
  try {
    const r = await fetch('https://rss.blog.naver.com/' + BLOG_ID + '.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error('rss ' + r.status);
    const posts = parse(await r.text());
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json({ posts });
  } catch (e) {
    res.status(502).json({ posts: [], error: 'blog_unavailable' });
  }
};
module.exports.parse = parse;
