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

  // 시공 후기 분류 필터
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
    var want = document.querySelector('.chip[data-f="' + location.hash.slice(1).replace(/[^a-z0-9]/g, '') + '"]');
    if (want) want.click();
  }

  // 커뮤니티: 네이버 블로그 글 (blog.json 은 GitHub Actions 가 주기적으로 갱신)
  var box = document.getElementById('posts');
  if (!box) return;
  var BLOG = 'https://blog.naver.com/jangsang40';
  function note(msg) {
    box.innerHTML = '';
    var p = document.createElement('p'); p.className = 'muted'; p.textContent = msg + ' ';
    var a = document.createElement('a'); a.href = BLOG; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = '블로그에서 직접 보기'; a.style.color = 'var(--accent)';
    p.appendChild(a); box.appendChild(p);
  }
  fetch('blog.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    if (!d.posts || !d.posts.length) return note('아직 불러온 글이 없습니다.');
    box.innerHTML = '';
    d.posts.forEach(function (post) {
      var a = document.createElement('a');
      a.className = 'post'; a.target = '_blank'; a.rel = 'noopener';
      a.href = /^https:\/\/(m\.)?blog\.naver\.com\//.test(post.link) ? post.link : BLOG;
      var t = document.createElement('time'); t.textContent = [post.date, post.category].filter(Boolean).join(' · ');
      var h = document.createElement('h3'); h.textContent = post.title;
      var p = document.createElement('p'); p.textContent = post.summary || '';
      a.appendChild(t); a.appendChild(h); a.appendChild(p); box.appendChild(a);
    });
  }).catch(function () { note('글을 불러오지 못했습니다.'); });
})();
