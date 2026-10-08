# Pantrip 영문 웹 데모 자산 — 2026-10-08

`public/assets/pantrip-demo-en.mp4`는 24.5초, 720×1566, 30fps, 무음 H.264/yuv420p, faststart 영상이다. 포스터는 첫 프레임을 JPEG로 추출했다. 주방·등록은 실제 앱 녹화이며 나머지는 실제 렌더 이미지를 배치·이동한 소개용 편집 장면이다. 전체 구간이 연속된 앱 사용 녹화나 웹에서 동작하는 앱이라고 표현하지 않는다.

| 구간 | 출처와 처리 |
|---|---|
| 0–5초: Kitchen | 전용 iPhone 17 Pro / iOS 26.3 시뮬레이터의 영문 carFactory 화면을 2026-10-08 녹화. 테스트 드라이브와 로봇·생산라인 애니메이션. 녹화 9–14초 구간을 사용해 포인트 토스트를 제외했다. |
| 5–12.5초: Photo | 앱 `TourPhotoClip.dataset/TourPhotoClip.mp4`의 2.1–9.6초. 영문 Orange Juice 등록·누끼·이름 인식·날짜 확인. 사진 선택기의 다른 썸네일은 제외했다. 날짜 스캔은 테스트 JPEG fixture이며 실제 카메라 촬영 증거가 아니다. |
| 12.5–16.5초: 3D | 홈페이지의 cup/wine/jar 실제 3D 렌더 PNG/WebP를 움직여 편집. 실시간 회전·새 모델 생성 영상이 아니다. |
| 16.5–20.5초: Kitchens | 실제 한옥·해적선·우주선·코파카바나·카페·자동차 공장 렌더 6장을 편집. |
| 20.5–24.5초: Widgets | 실제 앱 UpcomingView를 샘플 데이터로 렌더한 영문 중형·소형 위젯. 실제 홈 화면 녹화나 알림 수신 증거가 아니다. |

주방 녹화 앱은 main 저장소의 DerivedData `Pantrip-brxtefqpoufvymcaupxgrrzgrzep/Build/Products/Debug-iphonesimulator/Pantrip.app`(바이너리 수정 시각 2026-10-06 11:51)이다. 번들에 Git SHA가 없으므로 현재 HEAD를 새로 빌드했다고 주장하지 않는다. `-ui-testing-store web-demo-20261008`의 별도 저장소에 Coffee 1개를 만들었으며 사용자의 식품·사진·계정은 사용하지 않았다. 녹화 전 시스템 팝업·포인트 토스트를 확인하고 제거했다. 앱·서버 소스 수정은 없다.

주방 녹화는 `simctl io recordVideo --codec=h264`, 정규화·편집·포스터는 ffmpeg, 소개 장면은 Pillow로 처리했다. 모든 구간을 동일 해상도·SAR=1·30fps로 정규화하고 concat 후 `-movflags +faststart`로 게시본을 만들었다. 원 녹화의 추가 프레임은 게시하지 않는다. 정적 렌더 출처는 `PantripPreview-localized/assets/CAPTURE-PROVENANCE.md`다. 다른 제품의 영상·그래픽은 복사하지 않았다.

페이지의 장면 버튼은 시작 시각 0/5/12.5/16.5/20.5초로 이동한다. 한국어·영어 모두 같은 영문 영상이며, 영상 밖 위젯은 각 언어의 기존 이미지로 전환한다. 페이지 하단 접이식 안내에도 편집 장면·샘플 데이터를 구분한다.

## 정적 호스트와 장면 이동

첫 공개 검증에서 Sites는 HTTP 206/Content-Range를 응답했지만 Chrome의 `video.seekable`은 0–0이었고 장면 버튼을 누르면 0초로 돌아갔다. 따라서 구간 응답의 완전 미지원이라고 단정하지 않는다. 최종 코드는 HTML의 `data-src`를 같은 출처에서 한 번 fetch하고, 상태·출처·MIME·빈 파일을 검사한 뒤 Blob URL을 video에 연결한다. 약 710KiB의 작은 파일을 모두 받아 브라우저의 영상 탐색을 호스트 응답과 분리했다. 메타데이터 준비 전에는 장면·재생 버튼을 막고, 다운로드/디코딩 실패는 포스터를 유지한다. 일반 페이지 이탈은 진행 요청 취소와 URL 해제, BFCache는 재생 정지와 URL 유지로 처리한다.
