(function () {
  /* svc-menu: PC=가로 3열 클릭 펼침 / 휴대폰=첨부1 세로형 전체 표시 */
  function syncSvcMenu() {
    var wide = window.matchMedia("(min-width:901px)").matches;
    document.querySelectorAll(".svc-menu").forEach(function (menu) {
      var groups = menu.querySelectorAll(".svc-group");
      if (!wide) {
        groups.forEach(function (d) { d.open = true; });
        return;
      }
      var current = menu.querySelector('.svc-group a[aria-current="page"]');
      var currentGroup = current ? current.closest(".svc-group") : null;
      groups.forEach(function (d, i) {
        if (currentGroup) d.open = d === currentGroup;
        else d.open = i === 0;
      });
    });
  }
  syncSvcMenu();
  window.matchMedia("(min-width:901px)").addEventListener("change", syncSvcMenu);
  document.querySelectorAll(".svc-menu").forEach(function (menu) {
    menu.addEventListener("toggle", function (e) {
      var wide = window.matchMedia("(min-width:901px)").matches;
      var t = e.target;
      if (!t.classList || !t.classList.contains("svc-group")) return;
      if (!wide) { t.open = true; return; }
      if (!t.open) return;
      menu.querySelectorAll(".svc-group").forEach(function (d) { if (d !== t) d.open = false; });
    }, true);
  });
document.querySelectorAll('.side-acc').forEach(function (acc) {
    acc.addEventListener('toggle', function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains('side-group') || !t.open) return;
      acc.querySelectorAll('.side-group').forEach(function (d) { if (d !== t) d.open = false; });
    }, true);
  });

  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  function apply(t) {
    root.setAttribute('data-theme', t);
    if (btn) btn.setAttribute('aria-label', t === 'dark' ? '밝은 화면으로 전환' : '어두운 화면으로 전환');
  }
  try { var saved = localStorage.getItem('theme'); if (saved) apply(saved); } catch (e) {}
  if (btn) btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  var nav = document.getElementById('nav');
  var toggle = document.querySelector('.nav-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* 노트북+: 카테고리 클릭 시 페이지를 옆으로 전환 */
  var deskMq = window.matchMedia('(min-width:1101px)');
  var main = document.getElementById('main');
  var catbar = document.querySelector('.side-nav');
  var sliding = false;

  function catLinks() {
    return catbar ? Array.prototype.slice.call(catbar.querySelectorAll('a[href]')) : [];
  }
  function linkIndex(href) {
    var file = (href || '').split('#')[0].split('/').pop() || 'index.html';
    if (file === '' || file === '.') file = 'index.html';
    var links = catLinks();
    for (var i = 0; i < links.length; i++) {
      var h = (links[i].getAttribute('href') || '').split('#')[0].split('/').pop();
      if (h === file) return i;
    }
    if (file === 'index.html') return -1;
    return 0;
  }
  function currentFile() {
    var f = location.pathname.split('/').pop() || 'index.html';
    return f === '' ? 'index.html' : f;
  }
  function setCurrent(href) {
    var file = (href || '').split('#')[0].split('/').pop() || 'index.html';
    catLinks().forEach(function (a) {
      var h = (a.getAttribute('href') || '').split('#')[0].split('/').pop();
      if (h === file) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  function bindKakao() {
    var KAKAO_URL = '';
    document.querySelectorAll('[data-kakao]').forEach(function (a) {
      if (KAKAO_URL) { a.href = KAKAO_URL; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; }
      else { a.hidden = true; }
    });
  }
  function setPanel(name, push) {
    var panel = name || 'home';
    document.body.setAttribute('data-panel', panel);
    document.body.classList.add('is-home');
    if (nav) {
      nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
        var id = (a.getAttribute('href') || '').slice(1);
        if (id && id === panel) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    }
    if (push !== false) {
      var hash = panel === 'home' ? 'index.html' : ('index.html#' + panel);
      history.pushState({ panel: panel }, '', hash);
    }
  }
  function goSide(url, push) {
    if (!main || !deskMq.matches || sliding) return;
    var raw = url || '';
    var hash = raw.indexOf('#') >= 0 ? raw.split('#')[1] : '';
    var target = raw.split('#')[0] || 'index.html';
    var file = target.split('/').pop() || 'index.html';
    if (file === '' || file === '.') file = 'index.html';

    /* 홈 안 패널(#services 등)은 스크롤 없이 화면만 바꿈 */
    if ((file === 'index.html' || file === currentFile()) && document.body.classList.contains('is-home') && hash) {
      setPanel(hash, push !== false);
      return;
    }
    if (file === 'index.html' && document.body.classList.contains('is-home') && !hash) {
      setPanel('home', push !== false);
      catLinks().forEach(function (a) { a.removeAttribute('aria-current'); });
      return;
    }

    var from = linkIndex(currentFile());
    var to = linkIndex(file);
    var forward = to >= from;
    sliding = true;
    main.classList.add('is-sliding', forward ? 'slide-out-left' : 'slide-out-right');
    fetch(file, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw 0;
      return r.text();
    }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var nextMain = doc.getElementById('main');
      if (!nextMain) throw 0;
      window.setTimeout(function () {
        main.innerHTML = nextMain.innerHTML;
        main.classList.remove('slide-out-left', 'slide-out-right');
        main.classList.add(forward ? 'slide-in-right' : 'slide-in-left');
        document.title = doc.title || document.title;
        var isHome = !!nextMain.querySelector('.promise') || file === 'index.html';
        document.body.classList.toggle('is-home', isHome);
        if (isHome) document.body.setAttribute('data-panel', hash || 'home');
        else document.body.removeAttribute('data-panel');
        setCurrent(file);
        bindKakao();
        main.scrollTop = 0;
        if (push !== false) history.pushState({ side: true, url: file }, '', file + (hash ? '#' + hash : ''));
        window.setTimeout(function () {
          main.classList.remove('slide-in-left', 'slide-in-right', 'is-sliding');
          sliding = false;
        }, 280);
      }, 240);
    }).catch(function () {
      sliding = false;
      main.classList.remove('is-sliding', 'slide-out-left', 'slide-out-right');
      location.href = file;
    });
  }
  if (catbar && main) {
    catbar.addEventListener('click', function (e) {
      if (!deskMq.matches) return;
      var a = e.target.closest('a[href]');
      if (!a || a.target === '_blank') return;
      var href = a.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|sms:)/i.test(href)) return;
      e.preventDefault();
      var file = (href.split('#')[0].split('/').pop() || 'index.html');
      if (file === currentFile() && !href.split('#')[1]) return;
      goSide(href, true);
    });
  }
  if (nav && main) {
    nav.addEventListener('click', function (e) {
      if (!deskMq.matches) return;
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        e.preventDefault();
        if (!document.body.classList.contains('is-home')) {
          goSide('index.html' + href, true);
        } else {
          setPanel(href.slice(1) || 'home', true);
        }
        return;
      }
      if (/^(https?:|mailto:|tel:|sms:)/i.test(href) || a.target === '_blank') return;
      if (!/\.html/i.test(href)) return;
      e.preventDefault();
      goSide(href, true);
    });
  }
  var brand = document.querySelector('.brand');
  if (brand && main) {
    brand.addEventListener('click', function (e) {
      if (!deskMq.matches) return;
      e.preventDefault();
      if (document.body.classList.contains('is-home')) {
        setPanel('home', true);
        catLinks().forEach(function (a) { a.removeAttribute('aria-current'); });
        return;
      }
      goSide('index.html', true);
    });
  }
  window.addEventListener('popstate', function (ev) {
    if (!deskMq.matches) return;
    if (ev.state && ev.state.panel) {
      if (!document.body.classList.contains('is-home')) goSide('index.html#' + ev.state.panel, false);
      else setPanel(ev.state.panel, false);
      return;
    }
    goSide(currentFile() + (location.hash || ''), false);
  });
  if (deskMq.matches && document.body.classList.contains('is-home')) {
    var start = (location.hash || '#home').slice(1) || 'home';
    if (start === 'top') start = 'home';
    document.body.setAttribute('data-panel', start);
  }

  // 카카오톡 문의: 카카오톡 채널 또는 오픈채팅 주소를 아래에 넣으면 버튼이 나타납니다.
  // 예) 'https://pf.kakao.com/_abcde/chat' 또는 'https://open.kakao.com/o/abcdefg'
  var KAKAO_URL = '';
  document.querySelectorAll('[data-kakao]').forEach(function (a) {
    if (KAKAO_URL) { a.href = KAKAO_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.hidden = true; }
  });

  // 분류 필터 (시공 후기, 업체 블로그 공통)
  var activeCat = 'all';
  var activeFirm = 'all';
  function applyFilters() {
    document.querySelectorAll('.work').forEach(function (w) {
      var catOk = activeCat === 'all' || w.getAttribute('data-cat') === activeCat;
      var firmOk = activeFirm === 'all' || w.getAttribute('data-firm') === activeFirm;
      w.hidden = !(catOk && firmOk);
    });
  }
  function bindChips() {
    var chips = document.querySelectorAll('#blog-chips .chip, .chips:not(.firms) > .chip');
    if (!document.getElementById('blog-chips')) chips = document.querySelectorAll('.chip');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var bar = c.parentElement;
        bar.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('on', x === c); });
        activeCat = c.getAttribute('data-f') || 'all';
        applyFilters();
      });
    });
    if (chips.length && location.hash) {
      var want = document.querySelector('.chip[data-f="' + decodeURIComponent(location.hash.slice(1)).replace(/["\\]/g, '') + '"]');
      if (want) want.click();
    }
  }

  // 업체 블로그: 회원가입 후에만 목록·검색 공개
  var AUTH_USERS = 'fl-blog-users';
  var AUTH_SES = 'fl-blog-session';
  function normPhone(v) { return String(v || '').replace(/\D/g, ''); }
  function hashPw(pw) {
    var s = 'fl|' + String(pw || '');
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  }
  function readUsers() {
    try { var a = JSON.parse(localStorage.getItem(AUTH_USERS) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function writeUsers(list) { try { localStorage.setItem(AUTH_USERS, JSON.stringify(list)); } catch (e) {} }
  function readSession() {
    try { return JSON.parse(localStorage.getItem(AUTH_SES) || 'null'); } catch (e) { return null; }
  }
  function writeSession(u) {
    try {
      if (u) localStorage.setItem(AUTH_SES, JSON.stringify({ phone: u.phone, company: u.company, name: u.name, at: Date.now() }));
      else localStorage.removeItem(AUTH_SES);
    } catch (e) {}
  }
  function isAuthed() {
    var ses = readSession();
    if (!ses || !ses.phone) return false;
    return readUsers().some(function (u) { return u.phone === ses.phone; });
  }

  var box = document.getElementById('posts');
  var gate = document.getElementById('member-gate');
  var blogBody = document.getElementById('blog-body');
  if (!box && !gate) { bindChips(); }
  else if (box) {
  var BLOG = 'https://blog.naver.com/twri101';
  var blogLoaded = false;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function note(msg) {
    box.innerHTML = '';
    var p = el('p', 'muted', msg + ' ');
    var a = el('a', '', '블로그에서 직접 보기'); a.href = BLOG; a.target = '_blank'; a.rel = 'noopener'; a.style.color = 'var(--accent)';
    p.appendChild(a); box.appendChild(p);
  }
  function firmHay(m) {
    return [m.name, m.brand, m.area, m.blog, m.desc, m.id].filter(Boolean).join(' ').toLowerCase();
  }
  function paintAuthBar() {
    var bar = document.getElementById('auth-bar');
    if (!bar) return;
    var ses = readSession();
    if (!ses) { bar.hidden = true; bar.textContent = ''; return; }
    bar.hidden = false;
    bar.textContent = (ses.company || ses.name || '회원') + '님으로 로그인됨';
    var out = el('button', '', '로그아웃');
    out.type = 'button';
    out.addEventListener('click', function () { writeSession(null); refreshGate(); });
    bar.appendChild(out);
  }
  function loadBlog() {
    if (blogLoaded) return;
    blogLoaded = true;
    Promise.all([
      fetch('members.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
      fetch('blog.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
    ]).then(function (res) {
      var members = res[0] || [];
      var d = res[1] || {};
      if (!d.posts || !d.posts.length) return note('아직 불러온 글이 없습니다.');

      var firms = document.getElementById('firms');
      var qInput = document.getElementById('firm-q');
      var firmButtons = [];

      function paintFirms(query) {
        if (!firms) return;
        var q = (query || '').trim().toLowerCase();
        firms.innerHTML = '';
        firmButtons = [];
        var allBtn = el('button', 'firm-card' + (activeFirm === 'all' ? ' on' : ''));
        allBtn.type = 'button';
        allBtn.setAttribute('data-firm', 'all');
        allBtn.appendChild(el('strong', '', '전체 업체'));
        allBtn.appendChild(el('span', '', members.length + '곳 · 글 ' + d.posts.length));
        firms.appendChild(allBtn);
        firmButtons.push(allBtn);

        members.forEach(function (m) {
          if (q && firmHay(m).indexOf(q) === -1) return;
          var n = d.posts.filter(function (p) { return p.blog === m.blog || p.member === m.id; }).length;
          var btn = el('button', 'firm-card' + (activeFirm === m.id ? ' on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-firm', m.id);
          var top = el('div', 'firm-card-top');
          if (/^[a-z0-9_./-]+\.(png|jpg|webp)$/i.test(m.logo || '')) {
            var lg = el('img', 'firm-logo'); lg.src = m.logo; lg.alt = ''; top.appendChild(lg);
          }
          var meta = el('div');
          if (m.brand) meta.appendChild(el('small', '', m.brand));
          meta.appendChild(el('strong', '', m.name));
          top.appendChild(meta);
          btn.appendChild(top);
          if (m.area) btn.appendChild(el('span', 'firm-area', m.area));
          btn.appendChild(el('span', '', '글 ' + n + ' · @' + m.blog));
          firms.appendChild(btn);
          firmButtons.push(btn);
        });

        if (firmButtons.length === 1 && q) {
          firms.appendChild(el('p', 'muted', '검색 결과가 없습니다. 업체명·지역·블로그 ID로 다시 찾아 보세요.'));
        }

        firmButtons.forEach(function (btn) {
          btn.addEventListener('click', function () {
            activeFirm = btn.getAttribute('data-firm') || 'all';
            firmButtons.forEach(function (x) { x.classList.toggle('on', x === btn); });
            applyFilters();
          });
        });
      }

      if (qInput) {
        var t;
        qInput.addEventListener('input', function () {
          clearTimeout(t);
          t = setTimeout(function () { paintFirms(qInput.value); }, 120);
        });
      }
      paintFirms('');

      var visiblePosts = d.posts;
      /* 서비스 메뉴 순서로 카테고리 칩 정렬 */
      var CAT_ORDER = [
        '바닥 청소·코팅', '석재 연마·광택', '콘크리트 연마·폴리싱', '오염·접착제 제거', '계단·상판 복원',
        '사무실·상업공간 청소', '카펫·의자 청소', '에어컨 분해 청소',
        '외벽 청소', '화재 청소', '줄눈 시공', '소식'
      ];
      var counts = {};
      visiblePosts.forEach(function (p) { var c = p.cat || '소식'; counts[c] = (counts[c] || 0) + 1; });
      var order = CAT_ORDER.filter(function (c) { return counts[c]; });
      Object.keys(counts).forEach(function (c) { if (order.indexOf(c) === -1) order.push(c); });
      var bar = document.getElementById('blog-chips');
      if (bar) {
        bar.innerHTML = '';
        var all = el('button', 'chip on', '전체 ' + visiblePosts.length); all.type = 'button'; all.setAttribute('data-f', 'all'); bar.appendChild(all);
        order.forEach(function (c) { var b = el('button', 'chip', c + ' ' + counts[c]); b.type = 'button'; b.setAttribute('data-f', c); bar.appendChild(b); });
      }
      box.innerHTML = '';
      visiblePosts.forEach(function (post) {
        var a = el('a', 'work');
        a.href = /^\d{6,}$/.test(post.no || '') ? 'post.html?b=' + encodeURIComponent(post.blog || 'twri101') + '&no=' + post.no : BLOG;
        a.setAttribute('data-cat', post.cat || '소식');
        a.setAttribute('data-firm', post.member || '');
        var pic = el('div', 'work-img');
        if (post.img && /^blogimg\/\d+\.jpg$/.test(post.img)) { var im = el('img'); im.src = post.img; im.loading = 'lazy'; im.alt = ''; pic.appendChild(im); }
        else pic.appendChild(el('span', 'noimg', '블로그'));
        var body = el('div', 'work-body');
        body.appendChild(el('span', 'tag', post.cat || '소식'));
        body.appendChild(el('h3', '', post.title));
        body.appendChild(el('time', '', post.date || ''));
        a.appendChild(pic); a.appendChild(body); box.appendChild(a);
      });
      activeCat = 'all';
      activeFirm = 'all';
      bindChips();
      applyFilters();
    }).catch(function () { note('글을 불러오지 못했습니다.'); });
  }
  function refreshGate() {
    var ok = isAuthed();
    if (gate) gate.hidden = ok;
    if (blogBody) blogBody.hidden = !ok;
    paintAuthBar();
    if (ok) loadBlog();
    else {
      blogLoaded = false;
      if (box) box.innerHTML = '<p class="muted">로그인 후 글을 볼 수 있습니다.</p>';
      var firms = document.getElementById('firms');
      if (firms) firms.innerHTML = '';
      var chips = document.getElementById('blog-chips');
      if (chips) chips.innerHTML = '';
    }
  }
  if (gate) {
    var tabs = gate.querySelectorAll('.gate-tab');
    var loginForm = document.getElementById('login-form');
    var signupForm = document.getElementById('signup-form');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var which = tab.getAttribute('data-tab');
        tabs.forEach(function (x) {
          var on = x === tab;
          x.classList.toggle('on', on);
          x.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        if (loginForm) loginForm.hidden = which !== 'login';
        if (signupForm) signupForm.hidden = which !== 'signup';
      });
    });
    if (loginForm) loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(loginForm);
      var phone = normPhone(fd.get('phone'));
      var pw = String(fd.get('password') || '');
      var msg = document.getElementById('login-msg');
      var user = readUsers().filter(function (u) { return u.phone === phone && u.pw === hashPw(pw); })[0];
      if (!user || phone.length < 10) {
        if (msg) { msg.className = 'gate-msg'; msg.textContent = '휴대폰 또는 비밀번호를 확인해 주세요.'; }
        return;
      }
      writeSession(user);
      if (msg) { msg.className = 'gate-msg ok'; msg.textContent = '로그인되었습니다.'; }
      refreshGate();
    });
    if (signupForm) signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(signupForm);
      var phone = normPhone(fd.get('phone'));
      var company = String(fd.get('company') || '').trim();
      var name = String(fd.get('name') || '').trim();
      var pw = String(fd.get('password') || '');
      var blog = String(fd.get('blog') || '').trim().replace(/[^A-Za-z0-9_-]/g, '');
      var msg = document.getElementById('signup-msg');
      if (phone.length < 10 || !company || !name || pw.length < 4) {
        if (msg) { msg.className = 'gate-msg'; msg.textContent = '업체명·담당자·휴대폰·비밀번호(4자 이상)를 입력해 주세요.'; }
        return;
      }
      var list = readUsers();
      if (list.some(function (u) { return u.phone === phone; })) {
        if (msg) { msg.className = 'gate-msg'; msg.textContent = '이미 가입된 휴대폰 번호입니다. 로그인해 주세요.'; }
        return;
      }
      var user = { phone: phone, company: company, name: name, blog: blog, pw: hashPw(pw), at: Date.now() };
      list.push(user);
      writeUsers(list);
      writeSession(user);
      if (msg) { msg.className = 'gate-msg ok'; msg.textContent = '가입이 완료되었습니다.'; }
      refreshGate();
    });
  }
  refreshGate();
  }

  // 글 보기 페이지도 회원만 열람
  var frameEarly = document.getElementById('post-frame');
  if (frameEarly && !isAuthed()) {
    location.replace('community.html');
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
      var op = document.getElementById('post-open'); if (op) op.href = 'https://blog.naver.com/' + m.blog + '/' + no;
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
