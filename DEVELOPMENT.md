# YouTube History Quick Delete - 개발 문서

## 개요
YouTube 시청 기록 페이지에서 영상과 쇼츠를 빠르게 삭제할 수 있는 Chrome 확장 프로그램입니다. 각 썸네일에 삭제 버튼을 오버레이로 표시하고, 클릭 시 YouTube의 기본 메뉴를 자동으로 조작하여 삭제를 수행합니다.

## 핵심 기능
- **자동 아이템 탐지**: 일반 동영상과 쇼츠를 자동으로 감지
- **오버레이 삭제 버튼**: 썸네일 좌상단에 삭제 아이콘 표시
- **UI 자동화**: YouTube의 기본 메뉴를 자동으로 조작하여 삭제
- **동적 로딩 대응**: 무한 스크롤 등으로 추가된 아이템에도 자동 적용

## 기술 스택
- **Manifest V3**: Chrome 확장 프로그램 최신 표준
- **Content Script**: 페이지 내 JavaScript 실행
- **DOM 조작**: 요소 탐지 및 이벤트 시뮬레이션
- **MutationObserver**: 동적 콘텐츠 변화 감지

## 아이템 탐지 로직

### 1. 아이템 컨테이너 탐지
YouTube 시청 기록 페이지의 아이템들을 찾기 위해 다음과 같은 셀렉터를 사용합니다:

```javascript
const selectors = [
  // 일반 동영상 (실제 구조 기반)
  'yt-lockup-view-model',
  
  // 쇼츠 (실제 구조 기반)
  'ytm-shorts-lockup-view-model',
  'ytm-shorts-lockup-view-model-v2',
  
  // 백업 셀렉터들
  'ytd-video-renderer',
  'ytd-compact-video-renderer', 
  'ytd-rich-item-renderer',
  'ytd-grid-video-renderer',
  'ytd-reel-item-renderer',
  'ytd-video-meta-block',
  '[id="video-title"]',
  'ytd-thumbnail-overlay-toggle-button-renderer'
];
```

### 2. 썸네일 컨테이너 탐지
각 아이템에서 썸네일 컨테이너를 찾아 삭제 버튼을 추가합니다:

#### 일반 동영상 썸네일
```javascript
const videoSelectors = [
  '.yt-lockup-view-model__content-image',
  'yt-thumbnail-view-model',
  '.ytThumbnailViewModelImage',
  'img.ytCoreImageHost',
  'a[href*="/watch"]',
  'img[src*="ytimg.com"]'
];
```

#### 쇼츠 썸네일
```javascript
const shortsSelectors = [
  '.shortsLockupViewModelHostThumbnailContainer',
  '.shortsLockupViewModelHostThumbnailParentContainer', 
  '.shortsLockupViewModelHostThumbnail',
  'img.shortsLockupViewModelHostThumbnail',
  'img.ytCoreImageHost',
  'a[href*="/shorts"]',
  'img[src*="ytimg.com"]'
];
```

### 3. 아이템 타입 구분
쇼츠와 일반 동영상을 구분하여 각각에 맞는 셀렉터를 사용합니다:

```javascript
const isShorts = item.tagName.toLowerCase().includes('shorts') || 
                 item.className.includes('shorts') ||
                 item.querySelector('a[href*="/shorts"]');
```

## 삭제 프로세스

### 1. 메뉴 버튼 탐지
각 아이템에서 메뉴 버튼(세 점 아이콘)을 찾습니다:

```javascript
const menuButtonSelectors = [
  'button[aria-label="추가 작업"]',
  'button[title="추가 작업"]',
  '.yt-spec-button-shape-next--icon-button',
  'button.yt-spec-button-shape-next',
  'ytd-menu-renderer button[aria-haspopup="menu"]',
  'ytd-menu-renderer #button',
  'ytd-menu-renderer yt-icon-button',
  'button[aria-haspopup="menu"]'
];
```

### 2. 메뉴 열기 및 대기
메뉴 버튼을 클릭한 후 메뉴가 열릴 때까지 대기합니다:

```javascript
// 메뉴 버튼 클릭
menuButton.click();

// 메뉴가 열릴 때까지 대기
await utils.waitFor(() => {
  const menuSelectors = [
    'tp-yt-iron-dropdown',
    'ytd-menu-popup-renderer',
    'ytd-menu-renderer',
    '[role="menu"]',
    '.ytd-menu-popup-renderer'
  ];
  
  for (const selector of menuSelectors) {
    const menu = utils.findElement(selector);
    if (menu && menu.style.display !== 'none' && menu.offsetHeight > 0) {
      return true;
    }
  }
  return false;
}, 3000);
```

### 3. 삭제 메뉴 항목 탐지
열린 메뉴에서 "시청 기록에서 삭제" 항목을 찾습니다:

```javascript
const itemSelectors = [
  'yt-list-item-view-model[role="menuitem"]',
  'yt-list-item-view-model',
  '.yt-list-item-view-model__title',
  'span.yt-list-item-view-model__title',
  'ytd-menu-service-item-renderer',
  'ytd-menu-popup-renderer ytd-menu-service-item-renderer',
  '[role="menuitem"]'
];

// 텍스트 매칭으로 삭제 항목 찾기
const DELETE_LABELS = [
  '시청 기록에서 삭제',
  'Remove from watch history',
  'Remove from Watch history',
  'Remove from watch History'
];
```

### 4. 클릭 이벤트 시뮬레이션
메뉴 항목을 찾은 후 다양한 마우스 이벤트를 시뮬레이션합니다:

```javascript
// 클릭 이벤트 시뮬레이션
const clickEvent = new MouseEvent('click', {
  bubbles: true,
  cancelable: true,
  view: window
});

deleteItem.dispatchEvent(clickEvent);

// 추가로 mousedown, mouseup 이벤트도 시뮬레이션
const mouseDownEvent = new MouseEvent('mousedown', {
  bubbles: true,
  cancelable: true,
  view: window
});

const mouseUpEvent = new MouseEvent('mouseup', {
  bubbles: true,
  cancelable: true,
  view: window
});

deleteItem.dispatchEvent(mouseDownEvent);
setTimeout(() => {
  deleteItem.dispatchEvent(mouseUpEvent);
}, 50);
```

## 동적 로딩 대응

### 1. MutationObserver
DOM 변화를 감지하여 새로 추가된 아이템에도 삭제 버튼을 자동으로 추가합니다:

```javascript
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const isHistoryItem = node.matches && (
              node.matches('ytd-video-renderer') ||
              node.matches('ytd-compact-video-renderer') ||
              node.matches('ytd-reel-item-renderer')
            );
            
            if (isHistoryItem) {
              shouldScan = true;
              break;
            }
          }
        }
      }
    }
    
    if (shouldScan) {
      setTimeout(scanHistoryItems, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}
```

### 2. SPA 네비게이션 감지
YouTube는 SPA(Single Page Application)이므로 페이지 이동을 감지하여 재스캔합니다:

```javascript
function setupNavigationListener() {
  // YouTube 커스텀 이벤트 리스너
  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(scanHistoryItems, 500);
  });

  // URL 변화 감지 (폴백)
  let currentUrl = location.href;
  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      if (currentUrl.includes('/feed/history')) {
        setTimeout(scanHistoryItems, 1000);
      }
    }
  }, 1000);
}
```

## 스타일링

### 1. 삭제 버튼 오버레이
썸네일 좌상단에 삭제 버튼을 표시합니다:

```css
.dh-delete-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  border: none;
  outline: none;
}

.dh-delete-overlay:hover {
  background: rgba(255, 0, 0, 0.8);
  transform: scale(1.1);
}
```

### 2. 다크 테마 대응
YouTube의 다크 테마에 맞춰 버튼 스타일을 조정합니다:

```css
html[dark] .dh-delete-overlay {
  background: rgba(255, 255, 255, 0.1);
}

html[dark] .dh-delete-overlay:hover {
  background: rgba(255, 0, 0, 0.8);
}
```

## 에러 처리

### 1. 재시도 로직
메뉴나 항목을 찾지 못할 경우 재시도합니다:

```javascript
const RETRY_DELAYS = [100, 200, 500, 1000]; // 지수 백오프
const MAX_RETRIES = 4;
```

### 2. 사용자 피드백
삭제 실패 시 툴팁으로 사용자에게 알립니다:

```javascript
catch (error) {
  console.error('DelHist: 삭제 실패', error);
  overlay.classList.remove('dh-deleting');
  
  // 실패 시 툴팁 표시
  overlay.title = '삭제 실패: ' + error.message;
  setTimeout(() => {
    overlay.title = 'Delete from watch history';
  }, 3000);
}
```

## 개발 과정에서의 주요 도전과 해결책

### 1. YouTube의 동적 DOM 구조
**문제**: YouTube는 동적으로 콘텐츠를 로드하고 DOM 구조가 자주 변경됩니다.

**해결책**: 
- 실제 HTML 구조를 분석하여 정확한 셀렉터 사용
- 여러 셀렉터를 백업으로 준비
- MutationObserver로 동적 변화 감지

### 2. 쇼츠와 일반 동영상의 다른 구조
**문제**: 쇼츠와 일반 동영상의 HTML 구조가 다릅니다.

**해결책**:
- 아이템 타입을 구분하여 각각에 맞는 셀렉터 사용
- 쇼츠: `ytm-shorts-lockup-view-model`, 일반 동영상: `yt-lockup-view-model`

### 3. 메뉴 항목 클릭의 복잡성
**문제**: 단순한 `click()` 메서드로는 메뉴 항목이 제대로 클릭되지 않습니다.

**해결책**:
- 다양한 마우스 이벤트 시뮬레이션 (`click`, `mousedown`, `mouseup`)
- 이벤트 버블링 활성화 (`bubbles: true`)
- 적절한 타이밍으로 이벤트 발생

### 4. 메뉴 구조의 변화
**문제**: YouTube의 메뉴 구조가 예상과 달랐습니다.

**해결책**:
- 실제 메뉴 HTML 구조 분석
- `tp-yt-iron-dropdown`과 `yt-list-item-view-model` 사용
- 텍스트 매칭으로 정확한 항목 찾기

## 파일 구조

```
DelHist/
├── manifest.json                 # 확장 프로그램 설정
├── content/
│   ├── contentScript.js          # 메인 로직
│   └── contentStyles.css         # 스타일
├── assets/
│   └── icon.svg                  # 아이콘
├── README.md                     # 사용법
├── DEVELOPMENT.md               # 개발 문서 (이 파일)
└── plan.md                      # 초기 계획
```

## 설치 및 테스트

1. Chrome 확장 프로그램 페이지 (`chrome://extensions/`) 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램 로드" 클릭
4. DelHist 폴더 선택
5. YouTube 시청 기록 페이지 (`https://www.youtube.com/feed/history`) 접속
6. 썸네일 좌상단의 삭제 버튼 확인 및 테스트

## 향후 개선 사항

1. **설정 페이지**: 삭제 확인 다이얼로그, 버튼 위치 조정 등
2. **키보드 단축키**: Ctrl+클릭으로 다중 선택 삭제
3. **통계 기능**: 삭제한 아이템 수 표시
4. **백업 기능**: 삭제 전 임시 저장
5. **다국어 지원**: 더 많은 언어 지원

## 결론

이 확장 프로그램은 YouTube의 복잡한 DOM 구조와 동적 로딩을 분석하여 안정적으로 작동하도록 설계되었습니다. 실제 HTML 구조를 기반으로 한 정확한 셀렉터와 다양한 이벤트 시뮬레이션을 통해 사용자 경험을 향상시켰습니다.
