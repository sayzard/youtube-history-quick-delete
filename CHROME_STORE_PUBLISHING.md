# 크롬 웹 스토어 퍼블리싱 가이드

## 1. 사전 준비사항

### 필수 요구사항
- [ ] Google 계정
- [ ] Chrome Web Store 개발자 등록 ($5 일회성 등록비)
- [ ] 확장 프로그램 아이콘 (PNG 형식)
  - 128x128px (필수)
  - 48x48px (권장)
  - 16x16px (권장)
- [ ] 스크린샷 (최소 1개, 권장 5개)
  - 크기: 1280x800px 또는 640x400px
  - 형식: PNG 또는 JPG
- [ ] 프로모션 이미지 (선택사항이지만 권장)
  - 작은 타일: 440x280px
  - 큰 타일: 920x680px
  - 마켓플레이스 타일: 1400x560px

## 2. 개발자 등록

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 방문
2. Google 계정으로 로그인
3. $5 일회성 등록비 결제
4. 개발자 정보 입력

## 3. 확장 프로그램 준비

### 3.1 manifest.json 확인
- ✅ manifest_version: 3
- ✅ name: "YouTube History Quick Delete"
- ✅ version: "1.0.0"
- ✅ description: 있음
- ⚠️ icons: 추가 필요
- ⚠️ 추가 필드 권장사항

### 3.2 아이콘 생성
현재 `assets/icon.svg`가 있으므로 PNG로 변환 필요:
```bash
# ImageMagick을 사용한 변환 (설치 필요)
convert assets/icon.svg -resize 16x16 assets/icon-16.png
convert assets/icon.svg -resize 48x48 assets/icon-48.png
convert assets/icon.svg -resize 128x128 assets/icon-128.png
```

또는 온라인 도구 사용:
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Online-Convert](https://image.online-convert.com/convert-to-png)

### 3.3 스크린샷 준비
- 현재 `assets/images/demo-screenshot.png` 사용 가능
- 권장: 다양한 기능을 보여주는 3-5개의 스크린샷 추가

## 4. 확장 프로그램 패키징

### 4.1 배포 패키지 생성
```bash
# DelHist 디렉토리로 이동
cd /Volumes/D/Projects/DelHist

# ZIP 파일 생성 (불필요한 파일 제외)
zip -r youtube-history-quick-delete-v1.0.0.zip . \
  -x "*.git*" \
  -x "*DEVELOPMENT.md" \
  -x "*GITHUB_*.md" \
  -x "*test.html" \
  -x "*preview.html" \
  -x "assets/generate-icons.html" \
  -x "assets/images/demo-description.md"
```

또는 필요한 파일만 포함:
```bash
zip -r youtube-history-quick-delete-v1.0.0.zip \
  manifest.json \
  content/ \
  assets/icon-*.png \
  README.md \
  LICENSE
```

## 5. 크롬 웹 스토어 업로드

### 5.1 새 항목 만들기
1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole)에 접속
2. "새 항목" 버튼 클릭
3. ZIP 파일 업로드

### 5.2 스토어 등록 정보 입력

#### 기본 정보
- **제품 이름**: YouTube History Quick Delete
- **요약** (132자 이내):
  ```
  유튜브 시청 기록에서 영상과 쇼츠를 한 번의 클릭으로 빠르게 삭제할 수 있는 확장 프로그램
  ```

- **설명** (16,000자 이내):
  ```
  YouTube History Quick Delete는 유튜브 시청 기록 페이지에서 원하지 않는 영상을 빠르고 쉽게 삭제할 수 있도록 도와주는 크롬 확장 프로그램입니다.

  주요 기능:
  • 빠른 삭제 버튼: 모든 영상 썸네일에 삭제 버튼 추가
  • 모든 콘텐츠 지원: 일반 영상과 YouTube Shorts 모두 지원
  • 자동 감지: 무한 스크롤로 새로 로드되는 콘텐츠 자동 감지
  • 원클릭 삭제: 삭제 버튼 클릭만으로 시청 기록에서 즉시 제거
  • 다크/라이트 테마 지원: YouTube 테마에 자동 적응
  • 권한 불필요: 특별한 권한 없이 작동

  사용 방법:
  1. YouTube 시청 기록 페이지 방문 (https://www.youtube.com/feed/history)
  2. 각 영상 썸네일 왼쪽 상단의 빨간 삭제 버튼(🗑️) 확인
  3. 삭제 버튼 클릭으로 시청 기록에서 즉시 제거
  4. 일반 영상과 YouTube Shorts 모두 지원
  5. 무한 스크롤로 로드된 새 콘텐츠에 자동으로 버튼 추가

  개인정보 보호:
  • 데이터 수집 없음
  • 외부 요청 없음
  • 특별한 권한 불필요
  • 오픈소스

  이 확장 프로그램은 YouTube 또는 Google과 관련이 없는 독립적인 도구입니다.
  ```

#### 카테고리
- **기본 카테고리**: 생산성 (Productivity)
- **부 카테고리**: 검색 도구 (Search Tools) 또는 재미 (Fun)

#### 언어
- 한국어 (Korean)
- 영어 (English) - 선택사항

#### 아이콘
- 128x128px PNG 업로드

#### 스크린샷
- 1280x800px 또는 640x400px
- 최소 1개, 권장 3-5개
- 각 스크린샷에 설명 추가 가능

#### 프로모션 이미지 (선택사항)
- 작은 타일: 440x280px
- 큰 타일: 920x680px
- 마켓플레이스 타일: 1400x560px

### 5.3 개인정보 보호 관행
- **단일 목적**: ✅
  - "유튜브 시청 기록에서 영상을 빠르게 삭제"
- **권한 사용**: 없음 (content scripts만 사용)
- **호스트 권한**: youtube.com/feed/history
- **원격 코드**: 사용 안 함
- **사용자 데이터 수집**: 없음

### 5.4 배포 옵션
- **공개 범위**: 
  - 공개 (Public)
  - 미등록 (Unlisted)
  - 비공개 (Private)
- **지역**: 모든 지역 또는 특정 국가
- **가격**: 무료

## 6. 검토 및 게시

### 6.1 제출
1. 모든 정보 입력 완료
2. "검토 제출" 버튼 클릭
3. 자동 검토 통과 대기 (보통 몇 분 이내)

### 6.2 수동 검토
- 초기 검토: 일반적으로 1-3일 소요
- 때때로 추가 정보 요청 가능
- 이메일로 상태 업데이트 수신

### 6.3 게시
- 검토 승인 후 자동 게시
- 크롬 웹 스토어에서 검색 가능
- URL 공유 가능

## 7. 게시 후 관리

### 7.1 업데이트
```bash
# 버전 업데이트
# manifest.json의 version을 변경 (예: 1.0.0 -> 1.0.1)
# 새 ZIP 파일 생성
# Developer Dashboard에서 "업데이트 업로드"
```

### 7.2 모니터링
- 사용자 리뷰 확인 및 응답
- 통계 확인 (설치 수, 활성 사용자 등)
- 버그 리포트 확인

### 7.3 홍보
- GitHub README에 크롬 웹 스토어 링크 추가
- 소셜 미디어 공유
- 관련 커뮤니티에 소개

## 8. 체크리스트

### 제출 전
- [ ] manifest.json에 icons 필드 추가
- [ ] PNG 아이콘 생성 (16x16, 48x48, 128x128)
- [ ] ZIP 패키지 생성
- [ ] 스크린샷 준비
- [ ] 설명 텍스트 작성

### 개발자 대시보드
- [ ] 개발자 등록 완료
- [ ] 새 항목 생성
- [ ] ZIP 파일 업로드
- [ ] 스토어 등록 정보 입력
- [ ] 아이콘 업로드
- [ ] 스크린샷 업로드
- [ ] 개인정보 보호 관행 입력
- [ ] 검토 제출

### 게시 후
- [ ] 크롬 웹 스토어 URL 확인
- [ ] README.md 업데이트
- [ ] GitHub 릴리스 생성
- [ ] 홍보 활동

## 9. 유용한 링크

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extension 개발자 가이드](https://developer.chrome.com/docs/webstore/)
- [확장 프로그램 품질 가이드라인](https://developer.chrome.com/docs/webstore/program-policies/)
- [아이콘 디자인 가이드](https://developer.chrome.com/docs/webstore/images/)

## 10. 문제 해결

### 검토 거부된 경우
- 거부 사유 확인
- 필요한 수정 사항 적용
- 재제출

### 일반적인 거부 사유
- 불충분한 개인정보 보호 정책
- 오해의 소지가 있는 설명
- 품질 가이드라인 위반
- 상표권 침해

---

**참고**: 크롬 웹 스토어 정책과 가이드라인은 변경될 수 있으므로 최신 정보를 확인하세요.

