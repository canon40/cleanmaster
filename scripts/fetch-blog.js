// 네이버 블로그 RSS → blog.json + blogimg/
// 사용: npm run fetch-blog
// https://blog.naver.com/jangsang40 에 글을 쓰면 이 스크립트로 홈페이지에 반영합니다.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
process.chdir(ROOT);

const MEMBERS = JSON.parse(fs.readFileSync("members.json", "utf8")).filter((m) =>
  /^[A-Za-z0-9_-]{3,30}$/.test(m.blog || "")
);
const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
};

/** 서비스 메뉴와 동일한 분류 (위에서 먼저 매칭) */
const CATS = [
  ["에어컨 분해 청소", "aircon", /에어컨|실외기|냉난방기/],
  ["카펫·의자 청소", "carpet", /카펫\s*청소|카펫\s*크리닝|카펫,|카페트|의자\s*청소|객석/],
  ["줄눈 시공", "grout", /줄눈/],
  ["화재 청소", "fire", /화재|그을음/],
  ["외벽 청소", "exterior", /외벽|유리창\s*세척|렉산/],
  ["오염·접착제 제거", "removal", /본드|접착|바퀴자국|스키드|페인트|실리콘|스티커|기름때|백화|녹물|얼룩|콜탈/],
  ["콘크리트 연마·폴리싱", "concrete", /콘크리트|면갈이|우레탄|에폭시|폴리싱(?!타일)/],
  ["석재 연마·광택", "stone", /연마|도끼다시|테라조|대리석|화강석|석재|광택/],
  ["바닥 청소·코팅", "floor-wax", /포세린|나노코팅|논슬립타일|데코타일|디럭스타일|우드타일|아스타일|악세스플로어|왁스|코팅|마루|박리/],
  ["사무실·상업공간 청소", "office", /사무실|오피스|학교|교실|학원|매장|식당|병원|의원|준공|인테리어|입주|원상복구|수영장/],
  ["계단·상판 복원", "stairs", /계단|상판/],
];

function classify(text) {
  const hit = CATS.find(([, , re]) => re.test(text));
  if (hit) return { cat: hit[0], slug: hit[1] };
  return { cat: "소식", slug: "notice" };
}

function pick(xml, tag) {
  const m = xml.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">"));
  return m
    ? m[1]
        .replace(/^\s*<!\[CDATA\[/, "")
        .replace(/\]\]>\s*$/, "")
        .trim()
    : "";
}

function clean(s) {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function cover(BLOG_ID, logNo) {
  const file = "blogimg/" + logNo + ".jpg";
  if (fs.existsSync(file) && fs.statSync(file).size > 2000) return file;
  try {
    const r = await fetch("https://m.blog.naver.com/" + BLOG_ID + "/" + logNo, {
      headers: UA,
    });
    if (!r.ok) return "";
    const html = await r.text();
    const cands = [];
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/);
    if (m) cands.push(m[1]);
    (
      html.match(
        /https:\/\/(?:mblogthumb-phinf|postfiles|blogfiles|blogthumb)\.pstatic\.net\/[^"'\s\\<>)]+/g
      ) || []
    )
      .slice(0, 4)
      .forEach((u) => cands.push(u));

    for (let url of cands) {
      url = url.replace(/&amp;/g, "&");
      if (!/^https:\/\/[a-z0-9.-]+\.(pstatic\.net|naver\.net|naver\.com)\//.test(url)) continue;
      if (/blogpfthumb|blogpfp|profile|og_default|static\.blog|\.gif(\?|$)/i.test(url)) continue;
      url = /[?&]type=/.test(url)
        ? url.replace(/([?&])type=[^&]+/, "$1type=w800")
        : url + (url.includes("?") ? "&" : "?") + "type=w800";
      const ir = await fetch(url, {
        headers: { ...UA, Referer: "https://m.blog.naver.com/" },
      });
      if (!ir.ok || !/^image\/(jpeg|png|webp)/.test(ir.headers.get("content-type") || "")) continue;
      const buf = Buffer.from(await ir.arrayBuffer());
      if (buf.length < 5000 || buf.length > 3000000) continue;
      fs.mkdirSync("blogimg", { recursive: true });
      fs.writeFileSync(file, buf);
      return file;
    }
    return "";
  } catch (e) {
    return "";
  }
}

function loadKeepPosts() {
  try {
    const prev = JSON.parse(fs.readFileSync("blog.json", "utf8"));
    return (prev.posts || []).filter((p) => p.auto_cat_fill);
  } catch (e) {
    return [];
  }
}

(async () => {
  const posts = [];
  for (const mb of MEMBERS) {
    const BLOG_ID = mb.blog;
    let xml = "";
    try {
      const r = await fetch("https://rss.blog.naver.com/" + BLOG_ID + ".xml", {
        headers: UA,
      });
      if (!r.ok) throw new Error("RSS " + r.status);
      xml = await r.text();
    } catch (e) {
      console.error(BLOG_ID, String(e));
      continue;
    }

    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(BLOG_ID, "RSS items:", items.length);

    for (const it of items) {
      const title = clean(pick(it, "title"));
      const link = pick(it, "link").split("?")[0];
      const logNo = (link.match(/\/(\d{6,})$/) || [])[1];
      if (!title || !logNo) continue;
      const d = new Date(pick(it, "pubDate"));
      const { cat, slug } = classify(title + " " + clean(pick(it, "description")).slice(0, 80));
      posts.push({
        title,
        link,
        no: logNo,
        blog: BLOG_ID,
        member: mb.id,
        date: isNaN(d)
          ? ""
          : new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, "."),
        cat,
        slug,
        summary: clean(pick(it, "description")).slice(0, 160),
        img: await cover(BLOG_ID, logNo),
      });
    }
  }

  if (!posts.length) throw new Error("no posts from RSS");

  // 시공 사진용 보강 글: 해당 카테고리에 RSS 글이 아직 없을 때만 유지
  const keepFillers = loadKeepPosts().filter((p) => {
    const s = p.slug || "notice";
    const rssHas = posts.some((x) => (x.slug || "notice") === s);
    return !rssHas && p.img && fs.existsSync(p.img);
  });

  const merged = posts.concat(keepFillers);
  merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  fs.writeFileSync(
    "blog.json",
    JSON.stringify({ updated: new Date().toISOString(), posts: merged }, null, 1)
  );
  console.log(
    "posts:",
    merged.length,
    "(rss",
    posts.length,
    "+ keep",
    keepFillers.length + ")",
    "with image:",
    merged.filter((p) => p.img).length
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
