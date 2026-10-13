(function () {
  /* 화이트 / 눈 편한 다크 모드 */
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-toggle");
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  function applyTheme(t) {
    var mode = t === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", mode);
    if (metaTheme) {
      metaTheme.setAttribute("content", mode === "dark" ? "#161a22" : "#eef2f4");
    }
    if (themeBtn) {
      themeBtn.setAttribute(
        "aria-label",
        mode === "dark" ? "화이트 모드로 전환" : "눈 편한 다크 모드로 전환"
      );
      themeBtn.title = mode === "dark" ? "화이트 모드" : "눈 편한 다크 모드";
    }
  }

  try {
    var saved = localStorage.getItem("fl-theme");
    if (saved === "dark" || saved === "light") applyTheme(saved);
    else applyTheme(root.getAttribute("data-theme") || "light");
  } catch (e) {
    applyTheme("light");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("fl-theme", next);
      } catch (e) {}
    });
  }

  /* 서비스 메뉴 순서와 동일한 카테고리 */
  var CAT_ORDER = [
    { slug: "floor-wax", label: "바닥 청소·코팅" },
    { slug: "stone", label: "석재 연마·광택" },
    { slug: "concrete", label: "콘크리트 연마·폴리싱" },
    { slug: "removal", label: "오염·접착제 제거" },
    { slug: "stairs", label: "계단·상판 복원" },
    { slug: "office", label: "사무실·상업공간 청소" },
    { slug: "carpet", label: "카펫·의자 청소" },
    { slug: "aircon", label: "에어컨 분해 청소" },
    { slug: "exterior", label: "외벽 청소" },
    { slug: "fire", label: "화재 청소" },
    { slug: "grout", label: "줄눈 시공" },
    { slug: "notice", label: "소식" }
  ];

  var nav = document.getElementById("nav");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });
    nav.querySelectorAll(".nav-item.has-sub > a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (!window.matchMedia("(max-width: 900px)").matches) return;
        e.preventDefault();
        var item = link.parentElement;
        var willOpen = !item.classList.contains("open");
        nav.querySelectorAll(".nav-item.open").forEach(function (el) {
          if (el !== item) el.classList.remove("open");
        });
        item.classList.toggle("open", willOpen);
      });
    });
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      if (a.closest(".nav-item.has-sub") && a.parentElement && a.parentElement.classList.contains("has-sub") && a === a.parentElement.querySelector(":scope > a")) {
        return;
      }
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "메뉴 열기");
      nav.querySelectorAll(".nav-item.open").forEach(function (el) {
        el.classList.remove("open");
      });
    });
  }

  /* 모바일 서비스 메뉴: 1·2·3 가로 탭 — 스크롤 이동 없이 패널만 교체 */
  var svcTabs = document.querySelectorAll(".svc-tab");
  var svcCols = document.querySelectorAll(".svc-col");
  var svcMenu = document.querySelector(".svc-menu");
  if (svcTabs.length && svcCols.length) {
    var activeSvcCol = "01";

    function isSvcTabMode() {
      return window.matchMedia("(max-width: 900px)").matches;
    }

    function activateSvcCol(col, keepScroll) {
      activeSvcCol = col || "01";
      var tabMode = isSvcTabMode();
      var lockY = keepScroll ? window.scrollY || window.pageYOffset : null;

      svcTabs.forEach(function (tab) {
        var on = tab.getAttribute("data-col") === activeSvcCol;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
      });

      svcCols.forEach(function (panel) {
        var on = panel.getAttribute("data-col") === activeSvcCol;
        panel.classList.toggle("is-active", on);
        if (tabMode) {
          if (on) panel.removeAttribute("hidden");
          else panel.setAttribute("hidden", "");
        } else {
          panel.removeAttribute("hidden");
        }
      });

      if (svcMenu) {
        svcMenu.classList.toggle("is-tab-mode", tabMode);
      }

      if (lockY !== null) {
        requestAnimationFrame(function () {
          window.scrollTo(0, lockY);
        });
      }
    }

    svcTabs.forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        activateSvcCol(tab.getAttribute("data-col"), true);
      });
    });

    activateSvcCol(activeSvcCol, false);
    window.addEventListener("resize", function () {
      activateSvcCol(activeSvcCol, true);
    });
  }

  var box = document.getElementById("posts");
  var chipBar = document.getElementById("blog-chips");
  if (!box || !chipBar) return;

  var statusEl = document.getElementById("blog-status");
  var pager = document.getElementById("blog-pager");
  var pagerLabel = document.getElementById("blog-pager-label");
  var btnPrev = document.getElementById("blog-prev");
  var btnNext = document.getElementById("blog-next");

  var activeCat = "floor-wax";
  var posts = [];
  var counts = {};
  var navCats = [];

  function qsCat() {
    try {
      var q = new URLSearchParams(location.search).get("cat");
      return q ? decodeURIComponent(q) : "";
    } catch (e) {
      return "";
    }
  }

  function catLabel(slug) {
    if (slug === "all") return "전체";
    for (var i = 0; i < CAT_ORDER.length; i++) {
      if (CAT_ORDER[i].slug === slug) return CAT_ORDER[i].label;
    }
    return slug;
  }

  function buildNavCats() {
    navCats = CAT_ORDER.filter(function (c) {
      return (counts[c.slug] || 0) > 0;
    }).map(function (c) {
      return c.slug;
    });
  }

  function filteredPosts() {
    if (activeCat === "all") return posts.slice();
    return posts.filter(function (p) {
      return (p.slug || "notice") === activeCat;
    });
  }

  function syncUrl() {
    var url = new URL(location.href);
    if (activeCat === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", activeCat);
    history.replaceState(null, "", url.pathname + url.search);
  }

  function updatePager() {
    if (!pager) return;
    if (activeCat === "all" || navCats.length < 2) {
      pager.hidden = true;
      return;
    }
    pager.hidden = false;
    var idx = navCats.indexOf(activeCat);
    if (idx < 0) idx = 0;
    if (pagerLabel) {
      pagerLabel.textContent = (idx + 1) + " / " + navCats.length + " · " + catLabel(activeCat);
    }
    if (btnPrev) btnPrev.disabled = idx <= 0;
    if (btnNext) btnNext.disabled = idx >= navCats.length - 1;
  }

  function setCategory(slug, scroll) {
    activeCat = slug || "floor-wax";
    syncUrl();
    paintChips();
    paintPosts(filteredPosts());
    updatePager();
    if (scroll) {
      var anchor = document.getElementById("blog-chips") || box;
      if (anchor && anchor.scrollIntoView) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function paintChips() {
    chipBar.innerHTML = "";

    CAT_ORDER.forEach(function (c) {
      var n = counts[c.slug] || 0;
      if (!n) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (activeCat === c.slug ? " on" : "");
      b.setAttribute("data-f", c.slug);
      b.textContent = c.label + " " + n;
      chipBar.appendChild(b);
    });

    var all = document.createElement("button");
    all.type = "button";
    all.className = "chip" + (activeCat === "all" ? " on" : "");
    all.setAttribute("data-f", "all");
    all.textContent = "전체 " + posts.length;
    chipBar.appendChild(all);
  }

  function paintPosts(list) {
    box.innerHTML = "";
    var label = catLabel(activeCat);
    var n = list.length;

    if (statusEl) {
      if (activeCat === "all") {
        statusEl.textContent = "전체 작업 글 " + n + "건 · 분류를 누르면 해당 작업만 봅니다.";
      } else if (!n) {
        statusEl.textContent = "「" + label + "」 분류에 등록된 글이 아직 없습니다.";
      } else {
        statusEl.textContent = "「" + label + "」 " + n + "건";
      }
    }

    if (!list.length) {
      box.innerHTML =
        '<p class="muted">이 분류의 글이 없습니다. 다른 분류를 선택해 주세요.</p>';
      return;
    }

    list.forEach(function (post) {
      var a = document.createElement("a");
      a.className = "work";
      a.href = post.link || "https://blog.naver.com/jangsang40";
      if (/^https?:\/\//i.test(a.href)) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.setAttribute("data-cat", post.slug || "notice");

      var pic = document.createElement("div");
      pic.className = "work-img";
      if (post.img && /^(blogimg|works|img)\/[^\s"'<>]+\.(jpe?g|png|webp)$/i.test(post.img)) {
        var im = document.createElement("img");
        im.src = post.img;
        im.loading = "lazy";
        im.alt = post.title || "";
        pic.appendChild(im);
      } else {
        var sp = document.createElement("span");
        sp.className = "noimg";
        sp.textContent = "블로그";
        pic.appendChild(sp);
      }

      var body = document.createElement("div");
      body.className = "work-body";
      var tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = post.cat || "소식";
      var h3 = document.createElement("h3");
      h3.textContent = post.title || "";
      var time = document.createElement("time");
      time.textContent = post.date || "";
      body.appendChild(tag);
      body.appendChild(h3);
      body.appendChild(time);

      a.appendChild(pic);
      a.appendChild(body);
      box.appendChild(a);
    });
  }

  chipBar.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    setCategory(btn.getAttribute("data-f") || "floor-wax", true);
  });

  if (btnPrev) {
    btnPrev.addEventListener("click", function () {
      var idx = navCats.indexOf(activeCat);
      if (idx > 0) setCategory(navCats[idx - 1], true);
    });
  }
  if (btnNext) {
    btnNext.addEventListener("click", function () {
      var idx = navCats.indexOf(activeCat);
      if (idx >= 0 && idx < navCats.length - 1) setCategory(navCats[idx + 1], true);
    });
  }

  fetch("blog.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw 0;
      return r.json();
    })
    .then(function (d) {
      posts = (d && d.posts) || [];
      counts = {};
      posts.forEach(function (p) {
        var s = p.slug || "notice";
        counts[s] = (counts[s] || 0) + 1;
      });
      buildNavCats();

      var want = qsCat();
      if (want === "all") {
        activeCat = "all";
      } else if (want && counts[want]) {
        activeCat = want;
      } else if (navCats.length) {
        activeCat = navCats[0];
      }

      setCategory(activeCat, false);
    })
    .catch(function () {
      box.innerHTML =
        '<p class="muted">글을 불러오지 못했습니다. <a href="https://blog.naver.com/jangsang40" target="_blank" rel="noopener" style="color:var(--accent)">네이버 블로그</a>에서 확인해 주세요.</p>';
    });
})();
