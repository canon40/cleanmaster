(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  function apply(t) {
    root.setAttribute('data-theme', t);
    btn.setAttribute('aria-label', t === 'dark' ? '밝은 화면으로 전환' : '어두운 화면으로 전환');
  }
  try { var saved = localStorage.getItem('theme'); if (saved) apply(saved); } catch (e) {}
  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  var nav = document.getElementById('nav');
  var toggle = document.querySelector('.nav-toggle');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  // 카카오톡 문의: 카카오톡 채널 또는 오픈채팅 주소를 아래에 넣으면 버튼이 나타납니다.
  // 예) 'https://pf.kakao.com/_abcde/chat' 또는 'https://open.kakao.com/o/abcdefg'
  var KAKAO_URL = '';
  document.querySelectorAll('[data-kakao]').forEach(function (a) {
    if (KAKAO_URL) { a.href = KAKAO_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.hidden = true; }
  });

  // 분류 필터 (시공 후기, 커뮤니티 공통)
  function bindChips() {
    var chips = document.querySelectorAll('.chip');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.toggle('on', x === c); });
        var f = c.getAttribute('data-f');
        document.querySelectorAll('.work').forEach(function (w) {
          w.hidden = f !== 'all' && w.getAttribute('data-cat') !== f;
        });
      });
    });
    // 주소 뒤 #분류 로 들어오면 해당 분류만 표시 (예: reviews.html#gall03)
    if (chips.length && location.hash) {
      var want = document.querySelector('.chip[data-f="' + decodeURIComponent(location.hash.slice(1)).replace(/["\\]/g, '') + '"]');
      if (want) want.click();
    }
  }

  // 커뮤니티: 네이버 블로그 글 (blog.json 과 사진은 GitHub Actions 가 주기적으로 갱신)
  var box = document.getElementById('posts');
  if (!box) { bindChips(); }
  else {
  var BLOG = 'https://blog.naver.com/jangsang40';
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function note(msg) {
    box.innerHTML = '';
    var p = el('p', 'muted', msg + ' ');
    var a = el('a', '', '블로그에서 직접 보기'); a.href = BLOG; a.target = '_blank'; a.rel = 'noopener'; a.style.color = 'var(--accent)';
    p.appendChild(a); box.appendChild(p);
  }
  fetch('blog.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    if (!d.posts || !d.posts.length) return note('아직 불러온 글이 없습니다.');
    var counts = {}, order = [];
    d.posts.forEach(function (p) { var c = p.cat || '소식'; if (!counts[c]) { counts[c] = 0; order.push(c); } counts[c]++; });
    order.sort(function (x, y) { return counts[y] - counts[x]; });
    var bar = document.getElementById('blog-chips');
    if (bar) {
      var all = el('button', 'chip on', '전체 ' + d.posts.length); all.type = 'button'; all.setAttribute('data-f', 'all'); bar.appendChild(all);
      order.forEach(function (c) { var b = el('button', 'chip', c + ' ' + counts[c]); b.type = 'button'; b.setAttribute('data-f', c); bar.appendChild(b); });
    }
    box.innerHTML = '';
    d.posts.forEach(function (post) {
      var a = el('a', 'work');
      a.href = /^\d{6,}$/.test(post.no || '') ? 'post.html?b=' + encodeURIComponent(post.blog || 'jangsang40') + '&no=' + post.no : BLOG;
      a.setAttribute('data-cat', post.cat || '소식');
      var pic = el('div', 'work-img');
      if (post.img && /^blogimg\/\d+\.jpg$/.test(post.img)) { var im = el('img'); im.src = post.img; im.loading = 'lazy'; im.alt = ''; pic.appendChild(im); }
      else pic.appendChild(el('span', 'noimg', '블로그'));
      var body = el('div', 'work-body');
      body.appendChild(el('span', 'tag', post.cat || '소식'));
      body.appendChild(el('h3', '', post.title));
      body.appendChild(el('time', '', post.date || ''));
      a.appendChild(pic); a.appendChild(body); box.appendChild(a);
    });
    bindChips();
  }).catch(function () { note('글을 불러오지 못했습니다.'); });
  }

  // 글 보기: 위에는 홈페이지 메뉴를 고정하고, 아래에 블로그 글, 오른쪽에 그 글을 쓴 업체의 버튼을 보여 줍니다.
  var frame = document.getElementById('post-frame');
  if (frame) {
    var q = new URLSearchParams(location.search);
    var blog = (q.get('b') || '').replace(/[^A-Za-z0-9_-]/g, '');
    var no = (q.get('no') || '').replace(/\D/g, '');
    var side = document.getElementById('member');
    var E2 = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
    var link = function (cls, text, href, blank) { var a = E2('a', cls, text); a.href = href; if (blank) { a.target = '_blank'; a.rel = 'noopener'; } return a; };
    Promise.all([
      fetch('members.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }),
      fetch('blog.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).catch(function () { return { posts: [] }; })
    ]).then(function (res) {
      var members = res[0], posts = res[1].posts || [];
      var m = members.filter(function (x) { return x.blog === blog; })[0];
      if (!m || !no) { location.replace('community.html'); return; }   // 등록된 회원의 글만 엽니다
      frame.src = 'https://m.blog.naver.com/' + m.blog + '/' + no;
      var mine = posts.filter(function (p) { return p.blog === m.blog; });
      var i = -1; mine.forEach(function (p, k) { if (p.no === no) i = k; });
      var cur = mine[i];
      if (cur) document.title = cur.title + ' | ' + m.name;
      side.innerHTML = '';
      var top = E2('div', 'member-top');
      if (/^[a-z0-9_./-]+\.(png|jpg|webp)$/i.test(m.logo || '')) { var lg = E2('img', 'member-logo'); lg.src = m.logo; lg.alt = ''; top.appendChild(lg); }
      var nm = E2('div'); nm.appendChild(E2('small', '', m.brand || '')); nm.appendChild(E2('strong', '', m.name)); top.appendChild(nm);
      side.appendChild(top);
      if (m.desc) side.appendChild(E2('p', 'member-desc', m.desc));
      if (m.area) side.appendChild(E2('p', 'member-area', '활동 지역 · ' + m.area));
      var btns = E2('div', 'member-btns');
      var sms = (m.sms || '').replace(/\D/g, '');
      var body = encodeURIComponent('[' + m.name + ' 견적문의]\n' + (cur ? '보고 온 글: ' + cur.title + '\n' : '') + '청소 종류: \n지역: \n면적(평): \n희망 날짜: ');
      if (/^https:\/\/(pf|open)\.kakao\.com\//.test(m.kakao || '')) btns.appendChild(link('btn kakao', '카카오톡 문의', m.kakao, true));
      if (sms) btns.appendChild(link('btn primary', '문자로 견적 문의', 'sms:' + sms + '?&body=' + body));
      (m.tel || []).forEach(function (t) { var d = String(t).replace(/\D/g, ''); if (d) btns.appendChild(link('btn ghost', '전화 ' + t, 'tel:' + d)); });
      if (cur && cur.cat) btns.appendChild(link('btn ghost', cur.cat + ' 글 더 보기', 'community.html#' + encodeURIComponent(cur.cat)));
      btns.appendChild(link('btn ghost', '네이버 블로그에서 보기', 'https://blog.naver.com/' + m.blog + '/' + no, true));
      side.appendChild(btns);
      var nav = E2('div', 'member-nav');
      if (i > 0) nav.appendChild(link('', '← 다음 글', 'post.html?b=' + m.blog + '&no=' + mine[i - 1].no));
      nav.appendChild(link('', '목록', 'community.html'));
      if (i >= 0 && i < mine.length - 1) nav.appendChild(link('', '이전 글 →', 'post.html?b=' + m.blog + '&no=' + mine[i + 1].no));
      side.appendChild(nav);
    }).catch(function () { location.replace('community.html'); });
  }
})();
