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

  // 네이버 블로그 최신 글 (api/blog.js 가 RSS를 읽어 전달)
  var box = document.getElementById('posts');
  if (!box) return;
  var BLOG = 'https://blog.naver.com/jangsang40';
  function fallback() {
    box.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'muted';
    p.textContent = '최신 글을 불러오지 못했습니다. 블로그에서 직접 확인해 주세요. ';
    var a = document.createElement('a');
    a.href = BLOG; a.target = '_blank'; a.rel = 'noopener'; a.textContent = '블로그 바로가기';
    a.style.color = 'var(--accent)';
    p.appendChild(a); box.appendChild(p);
  }
  fetch('/api/blog').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    if (!d.posts || !d.posts.length) return fallback();
    box.innerHTML = '';
    d.posts.slice(0, 6).forEach(function (post) {
      var a = document.createElement('a');
      a.className = 'post'; a.target = '_blank'; a.rel = 'noopener';
      a.href = /^https:\/\/(m\.)?blog\.naver\.com\//.test(post.link) ? post.link : BLOG;
      var t = document.createElement('time'); t.textContent = post.date || '';
      var h = document.createElement('h3'); h.textContent = post.title;
      var p = document.createElement('p'); p.textContent = post.summary || '';
      a.appendChild(t); a.appendChild(h); a.appendChild(p); box.appendChild(a);
    });
  }).catch(fallback);
})();
