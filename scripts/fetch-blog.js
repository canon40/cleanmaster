// 네이버 블로그 RSS를 읽어 blog.json 으로 저장합니다. GitHub Actions 가 주기적으로 실행합니다.
const fs = require('fs');
const BLOG_ID = 'jangsang40';
function pick(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim() : '';
}
function clean(s) {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
(async () => {
  const r = await fetch('https://rss.blog.naver.com/' + BLOG_ID + '.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('RSS ' + r.status);
  const xml = await r.text();
  const posts = (xml.match(/<item>[\s\S]*?<\/item>/g) || []).map((it) => {
    const d = new Date(pick(it, 'pubDate'));
    const desc = pick(it, 'description');
    const img = (desc.match(/<img[^>]+src=["']([^"']+)["']/) || [])[1] || '';
    return {
      title: clean(pick(it, 'title')),
      link: pick(it, 'link').split('?')[0],
      date: isNaN(d) ? '' : new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, '.'),
      category: clean(pick(it, 'category')),
      summary: clean(desc).slice(0, 160),
      image: /^https:\/\//.test(img) ? img : '',
    };
  }).filter((p) => p.title && p.link);
  fs.writeFileSync('blog.json', JSON.stringify({ blog: BLOG_ID, updated: new Date().toISOString(), posts }, null, 1));
  console.log('posts:', posts.length);
})().catch((e) => { console.error(e); process.exit(1); });
