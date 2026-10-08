# 크린마스터 홈페이지

빌드 과정이 없는 정적 사이트입니다. GitHub에 올리고 Vercel에 연결하면 바로 배포됩니다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 본문 (문구, 전화번호, 서비스 내용) |
| `styles.css` | 디자인 (기본 다크 모드, 밝은 화면 전환 지원) |
| `script.js` | 메뉴, 화면 밝기 전환, 블로그 최신 글 표시 |
| `api/blog.js` | 네이버 블로그 RSS를 읽어 오는 Vercel 서버 함수 |

## 배포 방법

1. github.com 에서 새 저장소를 만듭니다 (예: `cleanmaster-site`).
2. 이 폴더에서 아래 명령을 실행합니다.

   ```
   git init
   git add .
   git commit -m "크린마스터 홈페이지"
   git branch -M main
   git remote add origin https://github.com/내아이디/cleanmaster-site.git
   git push -u origin main
   ```

3. vercel.com 에 GitHub 계정으로 로그인 → Add New → Project → 방금 만든 저장소 Import → Deploy.
   설정은 바꿀 것이 없습니다 (Framework Preset: Other).
4. 배포가 끝나면 `프로젝트이름.vercel.app` 주소로 열립니다.

## 모든청소.com 도메인 연결

1. Vercel 프로젝트 → Settings → Domains 에 `모든청소.com` 을 추가합니다.
2. Vercel이 알려 주는 DNS 값(A 레코드 또는 네임서버)을 호스팅케이알(hosting.kr)의 도메인 관리 화면에 입력합니다.
   도메인 등록자 계정으로 로그인해야 합니다.
3. 연결하면 기존 홈페이지 대신 이 사이트가 열립니다. 기존 사이트는 서버에 그대로 남아 있습니다.

## 내용 수정

- 전화번호: `index.html` 에서 `010-8806-8664` 와 `01088068664` 를 찾아 바꿉니다.
- 블로그 아이디: `api/blog.js` 의 `BLOG_ID`, `index.html` 과 `script.js` 의 블로그 주소.
- 수정 후 `git add . && git commit -m "수정" && git push` 하면 Vercel이 자동으로 다시 배포합니다.
