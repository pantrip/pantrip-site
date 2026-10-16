# Pantrip 공개 안내 페이지

공식 공개 사이트 `https://pantrip.app/`와 `https://www.pantrip.app/`는 Cloudflare Pages의 `pantrip-site` 프로젝트에서 제공합니다. `public/`의 소개 페이지·개인정보·이용약관·고객지원을 `node build-public.mjs`로 `out/`에 빌드하며 관리자·API 문서는 제외합니다. GitHub Pages는 `public/`을 배포하는 호환 미러입니다. `.openai/hosting.json`은 이전 Sites용 설정입니다.

## 냉장고 이야기 소개 페이지 (2026-10-15)

`public/index.html` 한 파일이 소개 페이지 전체입니다(별도 `app.js`·`style.css`·`config.js` 없음). 순서: 원룸 주방(theme:studio) 밤 장면 속 열린 냉장고와 잊혀 가는 음식 → 사진 한 장 등록 → 내 냉장고와 Pantrip 한옥 주방 나란히(D-day 태그) → 출발 안내판(주방 12개, 실제 입장 영상) → 상품·장식 놀링 테이블 → `alley-collection` 패키지 탑승권 → 정책·지원 링크, 운영자·연락처, Google 로그인 설명, 출처. 가격·포인트는 표시하지 않습니다.

- 3D: three.js 0.160.0을 import map으로 `cdn.jsdelivr.net/npm/three@0.160.0`에서 불러오고, 글꼴은 Google Fonts입니다. 앱의 실제 상품 GLB(`assets/products/`)와 한옥·원룸 주방 GLB(`assets/kitchen-hanok.glb`, `assets/kitchen-studio.glb`)는 quantize·WebP만 쓰므로 별도 디코더가 필요 없습니다. 호스트가 `.glb`를 그대로 제공해야 합니다.
- WebGL이 없거나 동작 줄이기 설정이면 `assets/stills/`의 정지 장면과 HTML 라벨을 보여 주고 입장 영상을 자동 재생하지 않습니다. 정지 장면은 캡처용 파라미터(`?still=s1&p=0.72&camp=0.12`, `?still=s2&p=0.93`, `?still=s3&p=0.33`)로 1440×900과 390×844@2x를 렌더링해 만들었습니다.
- 스크롤 안정성(2026-10-16): 캔버스·장면·스크롤 구간은 최초 small viewport 높이를 공유하고 주소창에 의한 높이 변화에는 재배치하지 않습니다. 가로 폭이 바뀌면 새 높이를 측정하고 해당 구간의 위치를 보존합니다. 로딩·WebGL 컨텍스트 실패 후에는 구간 높이를 유지한 채 정지 장면으로 전환합니다. 각 장면의 텍스처·셰이더·첫 실제 렌더를 포스터 뒤에서 순서대로 준비하며, 스크롤이 멈추면 추가 렌더링도 멈춥니다. 모바일은 해상도·그림자 크기를 낮추고 좁은 주방 패널의 D-day는 간결한 배지와 연결선으로 표시합니다(전체 번역은 aria-label/title 유지).
- 언어: 10개(ko, en, ja, es, de, fr, th, ru, mn, vi). 브라우저 언어로 시작하고 오른쪽 위 선택은 이 기기에 저장합니다. 주방 이름·D-day 표기·등급명은 앱의 Localizable.xcstrings 용어를 씁니다. 카탈로그 항목 이름은 7개 언어이며 de/fr/vi는 영어로 표시합니다.
- 카탈로그 스냅숏: `assets/catalog/snapshot.json`(rev 709, 2026-10-14, 공개 카탈로그 schema 1). 갱신할 때는 카탈로그를 다시 받아 같은 필드만 추출합니다. 출시·판매 중인 항목과 무료 기본 상품만 쓰고, 미리보기 PNG는 투명 WebP(120KB 이하), 입장 영상은 가로 540px·무음·8초 이하·1.2MB 이하로 다시 인코딩합니다. 서드파티 CC BY 모델이 든 신발 모음과 주방 팩(온천·사바나·사막·보카주)은 제외합니다. 스냅숏의 rev와 날짜는 하단 문구에 그대로 표시됩니다.
- 출처: 원룸 창밖 야경 “Seoul-night-pano-cropped.jpg” by KLuwak(CC BY-SA 3.0), 사과 사진 USDA ARS(퍼블릭 도메인), 우주선 주방 일부 모델 “Rigged Astronaut” by J-Toastie(CC BY 3.0), 글꼴(SIL OFL), three.js(MIT). 하단 `출처`에 링크와 함께 표시합니다.
- 유지 항목: 제목, google-site-verification, canonical, referrer no-referrer, 파비콘, 정책·지원 링크, 운영자·연락처, 접힌 Google 로그인 설명(ko/en은 기존 문구 그대로, 나머지는 같은 사실의 번역), 기한 알림 안내. 분석·광고 스크립트와 App Store 링크는 없습니다. CSP 메타는 이전에도 없었고 추가하지 않았습니다.
- `check-public.mjs`는 문서 골격과 유지 항목, 10개 언어 카탈로그 키, 이미지 크기·alt, 동작 줄이기 처리, 참조 자산의 존재와 형식(glTF·MP4·WebP), 스냅숏 rev를 검사합니다.
- `check-scroll.mjs`는 실제 페이지의 진행률·유한 스크롤 보간·배지 충돌 회피 함수를 실행하며, 초기 정적 모드와 지연 실패의 높이 유지도 검사합니다. 실제 모바일 주소창·GPU 성능은 브라우저에서 별도로 확인합니다.
- 용량: `public/assets` 약 14MB(GLB 약 6.5MB, 입장 영상 약 6.9MB).

GitHub main 병합은 Cloudflare Pages의 운영 자동 배포와 GitHub Pages 미러 배포를 시작합니다. 두 배포의 완료 상태와 운영 주소의 실제 응답을 각각 확인합니다.

## 개인정보·이용약관·지원 페이지

- 원문: `legal-content.json` — 한국어, 영어, 일본어, 태국어, 러시아어, 스페인어, 몽골어.
- 생성: `node build-legal.mjs` → `public/privacy/<언어>.html`, `public/terms/<언어>.html`, `public/support/<언어>.html`.
- 검증: `node check-legal.mjs` — 21개 페이지의 언어, 연락처, 언어 선택·내부 링크, 추적 스크립트 부재를 확인합니다.
- 소개 페이지 검증: `node check-public.mjs && node check-scroll.mjs`.
- 공개 빌드: `node build-legal.mjs && node check-legal.mjs && node check-public.mjs && node check-scroll.mjs && node build-public.mjs`.
- 미리보기: `python3 -m http.server 8770 --bind 127.0.0.1 --directory public`.

생성한 HTML만 직접 수정하지 말고 원문을 수정한 뒤 다시 생성합니다. 페이지에 분석·광고 스크립트나 앱 계정 토큰을 넣지 않습니다. 문의: 전성훈 / jsh097610@gmail.com.

검색용 `robots.txt`와 `sitemap.xml`도 공개 빌드에 포함합니다. 홈페이지에는 공유 메타데이터와 WebSite/SoftwareApplication 구조화 데이터를 제공하며, 정책·지원 문서는 실제 Cloudflare Pages의 확장자 없는 공개 주소로 canonical과 상호 언어 링크를 생성합니다. sitemap은 홈페이지와 24개 정책·지원 문서만 포함하고 관리자/API는 제외합니다. robots는 접근 제어가 아니며 기존 관리자 인증을 대신하지 않습니다. 검색·AI 검색의 수집·색인·인용은 보장하지 않습니다.

## 현재 사실과 출시 확인 항목

현재 앱 분석은 기본 자동이며 별도 동의 팝업은 없습니다. 실제 앱 설정 → 개인정보 선택 → 이용 분석 화면의 중지·재개 버튼을 안내합니다. 중지하면 미전송 이벤트를 제거하며 기전송 자료는 별도 삭제 요청 대상입니다. 소셜 로그인 후 분석 ID는 제공자가 확인한 이메일(Apple 릴레이 포함)이며 익명·확인 이메일 없음은 expirycheck:<계정 UUID>입니다. 이메일은 이벤트 속성이 아닌 Amplitude 사용자 ID로 전송하고 이름은 보내지 않습니다. 서버는 검증된 이메일 ID 이력을 계정에 연결해 삭제 시 기존 UUID ID와 함께 처리합니다. 과거 기록의 자동 병합은 보장하지 않습니다. SDK의 IP 기반 위치 추론 비활성화는 확인했지만 전송 IP를 특정 값으로 고정했다고 단정하지 않습니다. 자동 분석의 적법성 검토가 끝났다고 주장하지 않습니다. 광고 동의/ATT와 분석 처리는 별개입니다.

식품 원본은 기본적으로 기기에 저장하며, 소셜 로그인 후 식품 동기화에 동의한 경우 정보·사진·썸네일을 Supabase에 저장합니다. iCloud 동기화는 종료합니다. 활동 보상은 식품 동기화 동의와 별개이며 활동 보상 검증용 ID·등록/완료 상태·시각·기한·시간대·보관 위치·사진 유무·해시는 서버에 전송됩니다. Open Food Facts에는 온라인 검색 시 바코드뿐 아니라 검색어·언어와 통신 정보도 전달됩니다. Gmail 지원 메일의 주소·본문·첨부·선택적 계정 ID 처리도 고지합니다.

계정 삭제 서버 기능이 배포되어 삭제 요청을 자동 처리하고 실패한 작업을 재시도합니다. 접수, 처리, 계정 삭제 완료와 외부 삭제 완료를 구분해 안내합니다. 삭제 후 기기 식품은 유지하며 서버의 계정·포인트·꾸미기 소유권과 동기화한 식품·사진은 삭제합니다. 합성 계정에서 서버 계정·서비스 데이터·RevenueCat 삭제와 상태 조회 완료를 확인했습니다. Amplitude는 해당 계정에 삭제할 데이터가 없는 no_matching_data 응답만 확인했으며, 기존 이벤트의 queued → Done과 실제 Apple 인증·권한 철회는 검증이 남아 있습니다. 완료 상태/복구 기록은 완료 후 30일, 필요한 현금 거래 기록은 원 거래 시각부터 5년 보관 후 파기하도록 구현되어 있습니다. 이 기록은 모든 외부 공급자 경로의 실기기 검증 완료를 뜻하지 않습니다. Cron 매분 실행의 job_run succeeded 및 worker HTTP 200/timed_out=false를 확인했습니다. 만료 기록 점검도 이 worker에 포함되지만, 실제 보관 기간이 지난 기록의 원격 파기 효과를 별도로 실증한 것은 아닙니다.

미확정 출시 항목: 지역별 분석 처리 근거, 국외 이전 법적 근거 및 실제 처리·보관 국가/기간, 공급자별 상세 고지, 과거 익명 분석 이벤트 삭제 범위, 원 결제 증빙 보존 적정성. 법인 소재지만으로 처리 국가를 단정하지 않습니다. Amplitude 12개월 자동 삭제는 저장이 확인되지 않았습니다.

번역은 동일 사실을 반영한 운영 초안입니다. 공개 페이지 생성·링크 검증은 법률 검토나 실서비스 삭제 검증을 대신하지 않습니다. 커밋·호스팅 공개는 별도 담당자가 진행합니다.

## 문서 UI와 참고 자료 (2026-09-29)

흰색/검정 배경, 시스템 글꼴, 단일 문서 폭, 언어 선택과 클릭 가능한 목차만 사용합니다. 운영체제의 다크 모드를 따르며 별도 JavaScript나 추적 도구를 추가하지 않습니다. 인쇄 시 언어 메뉴와 목차를 숨깁니다. `build-legal.mjs`가 원본 CSS도 `public/`으로 복사하므로 배포 스타일이 원본과 달라지지 않습니다.

- [개인정보보호위원회 2026 작성지침](https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20885): 목차를 통한 본문 이동, 권리 행사 안내, 변경 내용의 확인 가능성을 반영했습니다.
- [Apple 개인정보 안내](https://www.apple.com/legal/privacy/)와 [토스 개인정보처리방침](https://toss.im/privacy-policy): 공식 문서 진입 구조를 참고했습니다. HTTP 조회에서는 동적 본문이 제공되지 않아 전체 본문·화면을 검토했다고 주장하지 않습니다.
- [GitHub 개인정보처리방침](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement): 제목, 문서 탐색, 변경 안내를 중심으로 참고했습니다. 타 서비스의 법적 근거나 문구를 그대로 적용하지 않았습니다.

수집 경로, 계정 ID를 이용한 권리 행사·대리인 확인·거절 시 안내, 이번 문서 변경 이력을 7개 언어에 같은 범위로 보완했습니다. 한국 권익구제 연락처는 기존 9절에 유지합니다. `node check-legal.mjs`가 목차 대상·중복 ID·CSS 배포본 일치·변경 이력도 검사합니다.

사업자 정보/공개 연락 주소는 제공받지 않았으므로 임의로 만들지 않았습니다. 실제 처리국가·세부 보관기간·국외 이전 근거 등 위의 출시 확인 항목이 남아 있으며, 간결한 UI나 추가 안내가 그 법적 확인을 대신하지 않습니다. 이전 안내가 필요한 이용자는 공개 연락처로 요청할 수 있고, 기존 원문은 저장소 변경 이력으로 보존합니다.

## 공개 주소와 배포 (2026-09-30)

- 저장소: https://github.com/pantrip/pantrip-site
- 공식 안내: https://pantrip.app/ · https://www.pantrip.app/
- 개인정보: https://pantrip.app/privacy.html (언어 선택) · https://pantrip.app/privacy/en.html
- 이용약관: https://pantrip.app/terms.html (언어 선택) · https://pantrip.app/terms/en.html
- 고객지원: https://pantrip.app/support.html (언어 선택) · https://pantrip.app/support/en.html
- AdMob 인증 파일: https://pantrip.app/app-ads.txt — 기존 https://jeon0976.github.io/app-ads.txt 도 계속 제공하며 동일한 게시자 선언을 유지합니다.
- GitHub Pages 호환 미러: https://pantrip.github.io/pantrip-site/
- 운영자 전용: https://admin.pantrip.app/ (소유자 비공개; 이전 GitHub Pages `/admin/`은 이 주소로 이동)
- API 문서: https://api.pantrip.app/ (소유자 비공개)

2026-09-30 공개 루트와 7개 언어의 정책 21개 URL에서 HTTP 200을 확인했습니다. 페이지 내부 링크·CSS·언어 전환·관리자 OAuth callback은 현재 페이지의 상대 경로로 계산합니다. GitHub 저장소 리다이렉트가 이전 Pages URL을 보장하지 않으므로 기존 미러와 공식 도메인을 구분합니다.

Supabase 프로젝트 ref, 키, OAuth client ID, 앱 bundle ID 및 `expirycheck:` 분석 식별자는 이름 변경 대상이 아니다.

## 비공개 운영 도구 배포

`node build-private-admin.mjs`는 `private-admin/src/`의 `index.html`, `app.js`, `config.js`, `style.css`만 `private-admin/out/`에 복사한다. 테스트 파일·공개 소개·개인정보·지원 문서는 포함하지 않는다. `node --test private-admin/src/admin.test.mjs`로 관리자 테스트를 실행한다. 공개 `public/admin/`에는 새 주소로 이동하는 안내 페이지만 남으며 관리자 앱 소스는 포함하지 않는다.

비공개 관리자 Sites 설정은 `private-admin/.openai/hosting.json`이며 `static.directory`는 해당 폴더 기준 `out`이다. 사이트 접근 범위는 소유자 비공개로 적용했다. 정적 파일 자체는 인증 게이트가 아니며 기존 서버의 관리자 권한·운영자 세션 검증을 계속 사용한다.

2026-09-30 Supabase Auth Redirect URLs와 operator Edge CORS 허용 origin에 관리자 도메인을 적용했다. 관리자의 OAuth callback은 `https://admin.pantrip.app/`이며 현재 페이지 루트에서 계산한다. Sites 주소 `https://pantrip-admin.jsh097610.chatgpt.site/`의 callback과 origin도 허용했다. Google OAuth 제공자 callback은 기존 Supabase `/auth/v1/callback` 그대로다. 비공개 호스팅 로그인과 Pantrip 운영자 Google 로그인은 각각 필요하다.

같은 날 소유자 접근 게이트, 운영자 Google 로그인, DB 화면 이동을 확인했다. 기존 공개 관리자 경로는 새 주소 안내로 교체했다. 이 확인은 일반 사용자 서버 권한 거부, 앱 세션 공존 또는 외부 공급자의 계정 삭제 완료까지 검증했다는 의미는 아니다. 계정 삭제 관련 미검증 항목은 위 출시 확인 항목을 따른다.
