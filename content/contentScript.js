/* YouTube History Quick Delete - Content Script */

(function() {
  'use strict';

  // 설정
  const CONFIG = {
    DELETE_LABELS: [
      '시청 기록에서 삭제',
      'Remove from watch history',
      'Remove from Watch history',
      'Remove from watch History'
    ],
    RETRY_DELAYS: [100, 200, 500, 1000], // 지수 백오프
    MAX_RETRIES: 4
  };

  // SPA 라우팅 관리
  let overlayRoots = new Set();       // 붙인 오버레이 루트 노드들 추적
  let mo;                             // MutationObserver
  let initialized = false;
  let deletedItems = new WeakSet();   // 삭제된 아이템 추적

  // 시청기록 페이지인지 확인
  function isHistoryPage() {
    const isHistory = location.pathname.startsWith('/feed/history');
    return isHistory;
  }

  // 유틸리티 함수들
  const utils = {
    waitFor: (condition, timeout = 3000) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
          if (condition()) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout'));
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    },

    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    findElement: (selector, parent = document) => {
      return parent.querySelector(selector);
    },

    findElements: (selector, parent = document) => {
      return Array.from(parent.querySelectorAll(selector));
    },

    createElement: (tag, className, innerHTML) => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (innerHTML) el.innerHTML = innerHTML;
      return el;
    }
  };

  // 삭제 오버레이 생성
  function createDeleteOverlay() {
    const overlay = utils.createElement('button', 'dh-delete-overlay');
    overlay.setAttribute('aria-label', 'Delete from watch history');
    overlay.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
    return overlay;
  }

  // 썸네일 컨테이너 찾기
  function findThumbnailContainer(item) {
    
    // 쇼츠와 일반 동영상을 구분해서 처리
    const isShorts = item.tagName.toLowerCase().includes('shorts') || 
                     item.className.includes('shorts') ||
                     item.querySelector('a[href*="/shorts"]') ||
                     item.querySelector('[href*="/shorts"]');
    
    // 실제 HTML 구조에 맞는 셀렉터들 (업데이트됨)
    const selectors = [
      'yt-thumbnail-view-model',  // 새로운 구조
      'ytd-thumbnail',            // 기존 구조
      'a.yt-lockup-view-model__content-image', // 실제 링크 요소
      'a.shortsLockupViewModelHostEndpoint', // Shorts 링크 요소
      'div.shortsLockupViewModelHostThumbnailContainer', // Shorts 썸네일 컨테이너
      'a[href*="/watch"]',        // 비디오 링크
      'a[href*="/shorts"]',       // Shorts 링크
      'a#thumbnail',
      '#thumbnail',
      'img[src*="ytimg.com"]'
    ];
    
    for (const selector of selectors) {
      const thumbnail = utils.findElement(selector, item);
      if (thumbnail) {
        return thumbnail;
      }
    }

    // 부모 요소들도 확인 (최대 3단계까지만)
    let parent = item.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      for (const selector of selectors) {
        const thumbnail = utils.findElement(selector, parent);
        if (thumbnail) {
          return thumbnail;
        }
      }
      parent = parent.parentElement;
      depth++;
    }

    return null;
  }

  // 아이템에 삭제 오버레이 추가
  function addDeleteOverlay(item) {
    
    // 시청기록 페이지가 아니면 오버레이 추가하지 않음
    if (!isHistoryPage()) {
      return;
    }
    
    // 이미 마운트되었는지 확인하되, 실제 오버레이가 있는지도 확인
    if (item.getAttribute('data-dh-mounted') === '1') {
      const existingOverlay = item.querySelector('.dh-delete-overlay');
      if (existingOverlay) {
        return; // 이미 마운트되고 오버레이도 있음
      }
      // 마운트 표시는 있지만 실제 오버레이가 없으면 다시 처리
      item.removeAttribute('data-dh-mounted');
    }

    const thumbnail = findThumbnailContainer(item);
    if (!thumbnail) {
      return;
    }


    // 썸네일 컨테이너에 relative 포지셔닝 보정
    const computedStyle = window.getComputedStyle(thumbnail);
    if (computedStyle.position === 'static') {
      thumbnail.style.position = 'relative';
    }

    const overlay = createDeleteOverlay();
    
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      deleteHistoryItem(item, overlay);
    });
    
    // 추가적인 이벤트 차단
    overlay.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });
    
    overlay.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });

    thumbnail.appendChild(overlay);
    item.setAttribute('data-dh-mounted', '1');
    
    // 오버레이 루트 노드 추적에 추가
    overlayRoots.add(item);
    
  }

  // 메뉴 버튼 찾기 (개선된 버전)
  function findMenuButton(item) {
    
    const selectors = [
      // 실제 구조 기반 셀렉터들 (Shorts와 일반 영상 모두)
      'button[aria-label="추가 작업"]',
      'button[aria-label="작업 메뉴"]',
      'button[title="추가 작업"]',
      'button[title="작업 메뉴"]',
      '.yt-spec-button-shape-next--icon-button',
      'button.yt-spec-button-shape-next',
      
      // 새로운 구조 셀렉터들
      'button-view-model button',
      'yt-spec-button-shape-next',
      'button[aria-haspopup="menu"]',
      
      // ytd-menu-renderer 내부 버튼들
      'ytd-menu-renderer button[aria-haspopup="menu"]',
      'ytd-menu-renderer #button',
      'ytd-menu-renderer yt-icon-button',
      'ytd-menu-renderer button',
      
      // 일반적인 메뉴 버튼 패턴들
      'button[aria-label*="추가"]',
      'button[aria-label*="메뉴"]',
      'button[aria-label*="옵션"]',
      'button[aria-label*="작업"]',
      'button[title*="추가"]',
      'button[title*="메뉴"]',
      'button[title*="옵션"]',
      'button[title*="작업"]',
      
      // 아이템 내부의 모든 버튼 (백업용)
      'button',
      'yt-icon-button'
    ];

    for (const selector of selectors) {
      const button = utils.findElement(selector, item);
      if (button) {
        return button;
      }
    }
    
    // 부모 요소들도 확인
    let parent = item.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      for (const selector of selectors) {
        const button = utils.findElement(selector, parent);
        if (button) {
          return button;
        }
      }
      parent = parent.parentElement;
      depth++;
    }
    
    return null;
  }

  // 메뉴 항목 찾기 (개선된 버전)
  async function findDeleteMenuItemSimple() {
    
    // 더 포괄적인 셀렉터들
    const simpleSelectors = [
      'ytd-menu-service-item-renderer',
      'yt-list-item-view-model',
      '[role="menuitem"]',
      'button[role="menuitem"]',
      'a[role="menuitem"]',
      'div.yt-list-item-view-model__container',
      'div.yt-list-item-view-model__label'
    ];
    
    // 먼저 메뉴 컨테이너 내부에서 찾기
    const menuContainers = [
      'ytd-popup-container',
      'tp-yt-iron-dropdown',
      'yt-sheet-view-model',
      'yt-contextual-sheet-layout',
      'yt-list-view-model'
    ];
    
    for (const containerSelector of menuContainers) {
      const container = document.querySelector(containerSelector);
      if (container && container.style.display !== 'none') {
        
        for (const selector of simpleSelectors) {
          const items = container.querySelectorAll(selector);
          
          for (const item of items) {
            const text = item.textContent.trim();
            
            if (CONFIG.DELETE_LABELS.some(label => text.includes(label))) {
              return item;
            }
          }
        }
      }
    }
    
    // 메뉴 컨테이너에서 찾지 못했으면 전체 문서에서 찾기
    for (const selector of simpleSelectors) {
      const items = document.querySelectorAll(selector);
      
      for (const item of items) {
        const text = item.textContent.trim();
        
        if (CONFIG.DELETE_LABELS.some(label => text.includes(label))) {
          return item;
        }
      }
    }
    
    return null;
  }

  // 메뉴 항목 찾기 (기존 복잡한 버전 - 백업용)
  async function findDeleteMenuItem() {
    // 메뉴가 열렸는지 확인 (실제 구조 기반)
    const menuSelectors = [
      'ytd-popup-container', // 실제 메뉴 컨테이너
      'tp-yt-iron-dropdown', // 드롭다운 컨테이너
      'yt-sheet-view-model', // 시트 뷰 모델
      'yt-contextual-sheet-layout', // 컨텍스트 시트 레이아웃
      'ytd-menu-popup-renderer',
      'ytd-menu-renderer'
    ];
    
    let menu = null;
    for (const selector of menuSelectors) {
      menu = utils.findElement(selector);
      if (menu && menu.style.display !== 'none' && menu.offsetHeight > 0) {
        break;
      }
    }
    
    if (!menu) {
      return null;
    }

    // 메뉴 항목들이 로드될 때까지 대기
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      await utils.sleep(200);
      attempts++;
      
      // 메뉴 내부뿐만 아니라 전체 문서에서 메뉴 항목들을 찾기
      const hasMenuItems = menu.querySelector('[role="menuitem"]') || 
                          menu.querySelector('yt-list-item-view-model') ||
                          menu.querySelector('yt-list-view-model') ||
                          document.querySelector('yt-list-item-view-model[role="menuitem"]') ||
                          document.querySelector('yt-list-item-view-model') ||
                          menu.textContent.includes('시청 기록에서 삭제') ||
                          menu.textContent.includes('Remove from watch history') ||
                          document.body.textContent.includes('시청 기록에서 삭제') ||
                          document.body.textContent.includes('Remove from watch history') ||
                          menu.textContent.trim().length > 50; // 메뉴 버튼만 있는 경우보다 긴 텍스트
      
      if (hasMenuItems) {
        break;
      }
    }

    // 메뉴 항목들 찾기 (실제 구조 기반)
    const itemSelectors = [
      // 새로운 메뉴 구조 (ytd-menu-popup-renderer 기반)
      'ytd-menu-service-item-renderer[role="menuitem"]',
      'ytd-menu-service-item-renderer',
      'tp-yt-paper-item[role="option"]',
      'tp-yt-paper-item',
      
      // 기존 구조 (yt-sheet-view-model 기반)
      'yt-list-item-view-model[role="menuitem"]',
      'yt-list-item-view-model',
      'span[role="text"]', // 사용자가 제공한 HTML 구조에 맞춤
      '.yt-list-item-view-model__title',
      'span.yt-list-item-view-model__title',
      
      // 기존 셀렉터들 (백업용)
      'ytd-menu-popup-renderer ytd-menu-service-item-renderer',
      '[role="menuitem"]',
      'yt-menu-service-item-renderer',
      'button[role="menuitem"]',
      'a[role="menuitem"]'
    ];

    // 먼저 메뉴 내부에서 찾기
    for (const selector of itemSelectors) {
      const items = utils.findElements(selector, menu);
      
      for (const item of items) {
        const text = item.textContent.trim();
        
        if (CONFIG.DELETE_LABELS.some(label => text.includes(label))) {
          // 새로운 메뉴 구조 (ytd-menu-service-item-renderer) 처리
          if (item.tagName.toLowerCase() === 'ytd-menu-service-item-renderer') {
            return item;
          }
          
          // tp-yt-paper-item인 경우 부모 요소 찾기
          if (item.tagName.toLowerCase() === 'tp-yt-paper-item') {
            let parent = item.parentElement;
            let depth = 0;
            while (parent && depth < 5) {
              if (parent.tagName.toLowerCase() === 'ytd-menu-service-item-renderer' ||
                  parent.getAttribute('role') === 'menuitem') {
                return parent;
              }
              parent = parent.parentElement;
              depth++;
            }
            return item;
          }
          
          // 기존 구조 (yt-list-item-view-model) 처리
          if (item.tagName.toLowerCase() === 'yt-list-item-view-model') {
            return item;
          }
          
          // span[role="text"]인 경우 부모 요소 찾기
          if (item.tagName.toLowerCase() === 'span' && item.getAttribute('role') === 'text') {
            let parent = item.parentElement;
            let depth = 0;
            while (parent && depth < 5) {
              if (parent.tagName.toLowerCase() === 'yt-list-item-view-model' ||
                  parent.tagName.toLowerCase() === 'ytd-menu-service-item-renderer' ||
                  parent.getAttribute('role') === 'menuitem' ||
                  parent.tagName === 'BUTTON' || 
                  parent.tagName === 'A' ||
                  parent.onclick ||
                  parent.style.cursor === 'pointer') {
                return parent;
              }
              parent = parent.parentElement;
              depth++;
            }
            // 부모를 찾지 못했으면 span 자체 반환
            return item;
          }
          
          // 클릭 가능한 부모 요소 찾기
          let clickableParent = item;
          let depth = 0;
          while (clickableParent && depth < 5) {
            if (clickableParent.tagName.toLowerCase() === 'yt-list-item-view-model' ||
                clickableParent.getAttribute('role') === 'menuitem' ||
                clickableParent.tagName === 'BUTTON' || 
                clickableParent.tagName === 'A' ||
                clickableParent.onclick ||
                clickableParent.style.cursor === 'pointer' ||
                clickableParent.classList.contains('yt-spec-button-shape-next') ||
                clickableParent.classList.contains('ytd-menu-service-item-renderer')) {
              return clickableParent;
            }
            clickableParent = clickableParent.parentElement;
            depth++;
          }
          
          // 부모를 찾지 못했으면 텍스트 요소 자체를 반환
          return item;
        }
      }
    }
    
    // 메뉴 내부에서 찾지 못했으면 전체 문서에서 찾기
    for (const selector of itemSelectors) {
      const items = utils.findElements(selector, document);
      
      for (const item of items) {
        const text = item.textContent.trim();
        
        if (CONFIG.DELETE_LABELS.some(label => text.includes(label))) {
          // yt-list-item-view-model이면 바로 반환 (실제 구조 기반)
          if (item.tagName.toLowerCase() === 'yt-list-item-view-model') {
            return item;
          }
          
          // span[role="text"]인 경우 부모 요소 찾기
          if (item.tagName.toLowerCase() === 'span' && item.getAttribute('role') === 'text') {
            let parent = item.parentElement;
            let depth = 0;
            while (parent && depth < 5) {
              if (parent.tagName.toLowerCase() === 'yt-list-item-view-model' ||
                  parent.getAttribute('role') === 'menuitem' ||
                  parent.tagName === 'BUTTON' || 
                  parent.tagName === 'A' ||
                  parent.onclick ||
                  parent.style.cursor === 'pointer') {
                return parent;
              }
              parent = parent.parentElement;
              depth++;
            }
            // 부모를 찾지 못했으면 span 자체 반환
            return item;
          }
          
          // 클릭 가능한 부모 요소 찾기
          let clickableParent = item;
          let depth = 0;
          while (clickableParent && depth < 5) {
            if (clickableParent.tagName.toLowerCase() === 'yt-list-item-view-model' ||
                clickableParent.getAttribute('role') === 'menuitem' ||
                clickableParent.tagName === 'BUTTON' || 
                clickableParent.tagName === 'A' ||
                clickableParent.onclick ||
                clickableParent.style.cursor === 'pointer' ||
                clickableParent.classList.contains('yt-spec-button-shape-next') ||
                clickableParent.classList.contains('ytd-menu-service-item-renderer')) {
              return clickableParent;
            }
            clickableParent = clickableParent.parentElement;
            depth++;
          }
          
          // 부모를 찾지 못했으면 텍스트 요소 자체를 반환
          return item;
        }
      }
    }
    
    return null;
  }

  // 시청 기록에서 삭제 실행 (개선된 버전)
  async function deleteHistoryItem(item, overlay) {
    try {
      overlay.classList.add('dh-deleting');

      // 메뉴 버튼 찾기
      const menuButton = findMenuButton(item);
      if (!menuButton) {
        throw new Error('메뉴 버튼을 찾을 수 없음');
      }

      menuButton.click();

      // 메뉴가 렌더링될 때까지 대기 (최대 2초)
      let deleteItem = null;
      for (let i = 0; i < 10; i++) {
        await utils.sleep(200);
        deleteItem = await findDeleteMenuItemSimple();
        if (deleteItem) {
          break;
        }
      }

      if (!deleteItem) {
        throw new Error('삭제 메뉴 항목을 찾을 수 없음');
      }

      deleteItem.click();

      // 삭제 완료 대기
      await utils.sleep(1000);


      // 삭제된 아이템 추적
      deletedItems.add(item);

      // 오버레이 제거
      overlay.remove();

    } catch (error) {
      overlay.classList.remove('dh-deleting');

      // 실패 시 툴팁 표시
      overlay.title = '삭제 실패: ' + error.message;
      setTimeout(() => {
        overlay.title = 'Delete from watch history';
      }, 3000);
    }
  }

  // 모든 오버레이 제거
  function removeAllOverlays() {

    overlayRoots.forEach(root => {
      const overlays = root.querySelectorAll('.dh-delete-overlay');
      overlays.forEach(overlay => overlay.remove());
      root.removeAttribute('data-dh-mounted');
    });
    overlayRoots.clear();
    deletedItems = new WeakSet(); // 삭제된 아이템 목록 초기화
    initialized = false;

    if (mo) {
      mo.disconnect();
      mo = null;
    }

  }

  // 오버레이 추가 (중복 안전)
  function addOverlaysIfNeeded() {
    if (!isHistoryPage()) {
      return;
    }
    // 이미 초기화했다면 중복 주입 방지
    if (initialized) {
      return;
    }
    initialized = true;

    scanHistoryItems();

    // 동적 로딩 대응 (제한적)
    if (!mo) {
      mo = new MutationObserver((mutations) => {
        if (!isHistoryPage()) {
          return;
        }
        
        // 변화가 있을 때만 스캔 (성능 최적화)
        let shouldScan = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldScan = true;
            break;
          }
        }
        
        if (shouldScan) {
          setTimeout(() => {
            scanHistoryItems();
          }, 500); // 디바운싱
        }
      });
      mo.observe(document.body, { childList: true, subtree: false }); // subtree 제한
    }
  }

  // 라우트 변경 처리
  function onRouteChange() {
    
    if (isHistoryPage()) {
      addOverlaysIfNeeded();
    } else {
      // 시청기록이 아닌 페이지에선 반드시 정리
      removeAllOverlays();
    }
  }

  // 시청 기록 아이템들 스캔 (성능 최적화)
  function scanHistoryItems() {
    
    // 실제 HTML 구조에 맞는 셀렉터들 (업데이트됨)
    const selectors = [
      'yt-lockup-view-model',           // 새로운 구조 (실제 HTML에서 확인됨)
      'ytm-shorts-lockup-view-model-v2', // 새로운 Shorts 구조
      'ytm-shorts-lockup-view-model',    // 기존 Shorts 구조
      'ytd-video-renderer',             // 기존 구조
      'ytd-compact-video-renderer',     // 기존 구조
      'ytd-rich-item-renderer',         // 기존 구조
      'ytd-item-section-renderer',      // 섹션 렌더러
      'ytd-grid-video-renderer'         // 그리드 렌더러
    ];

    let totalItems = 0;
    let processedItems = new Set();
    
    for (const selector of selectors) {
      const items = document.querySelectorAll(selector);
      
      for (const item of items) {
        // 이미 처리된 아이템인지 확인
        if (processedItems.has(item)) continue;

        // 삭제된 아이템인지 확인
        if (deletedItems.has(item)) {
          continue;
        }

        // 실제로 썸네일이 있는 아이템인지 확인
        const thumbnail = findThumbnailContainer(item);
        if (thumbnail) {
          addDeleteOverlay(item);
          processedItems.add(item);
          totalItems++;
        } else {
        }
      }
    }
    
  }
  
  // 비디오 아이템인지 확인하는 함수
  function isVideoItem(element) {
    // 비디오 관련 클래스나 속성이 있는지 확인
    const className = element.className || '';
    const id = element.id || '';
    const tagName = element.tagName.toLowerCase();
    
    // 비디오 관련 키워드들
    const videoKeywords = [
      'video', 'thumbnail', 'renderer', 'item', 'compact', 'rich', 'grid', 'reel'
    ];
    
    // 태그명이 비디오 관련인지 확인
    if (tagName.includes('video') || tagName.includes('renderer') || tagName.includes('item')) {
      return true;
    }
    
    // 클래스명이 비디오 관련인지 확인
    for (const keyword of videoKeywords) {
      if (className.toLowerCase().includes(keyword)) {
        return true;
      }
    }
    
    // ID가 비디오 관련인지 확인
    for (const keyword of videoKeywords) {
      if (id.toLowerCase().includes(keyword)) {
        return true;
      }
    }
    
    // 자식 요소에 비디오 링크가 있는지 확인
    const videoLinks = element.querySelectorAll('a[href*="/watch"]');
    if (videoLinks.length > 0) {
      return true;
    }
    
    return false;
  }

  // SPA 네비게이션 감지 및 라우팅 처리
  function setupNavigationListener() {

    // 초기 진입 처리
    onRouteChange();

    // YouTube 내부 라우팅 이벤트
    document.addEventListener('yt-navigate-start', () => {
      // 페이지 이동 시작 시 이전 페이지 오버레이 정리
      removeAllOverlays();
    });

    document.addEventListener('yt-navigate-finish', () => {
      // 페이지 이동 완료 후 새 페이지 처리
      setTimeout(() => {
        onRouteChange();
      }, 100); // 짧은 지연으로 DOM 안정화 대기
    });

    document.addEventListener('yt-page-data-updated', () => {
      // 페이지 데이터 업데이트 시에도 처리
      setTimeout(() => {
        onRouteChange();
      }, 100);
    });

    // 혹시 모를 pushState 사용 케이스에 대비(보통 위 이벤트로 충분)
    const _pushState = history.pushState;
    history.pushState = function(...args) {
      _pushState.apply(this, args);
      queueMicrotask(() => {
        setTimeout(onRouteChange, 100);
      });
    };
    const _replaceState = history.replaceState;
    history.replaceState = function(...args) {
      _replaceState.apply(this, args);
      queueMicrotask(() => {
        setTimeout(onRouteChange, 100);
      });
    };

    window.addEventListener('popstate', () => {
      setTimeout(onRouteChange, 100);
    });

  }

  // 초기화
  function init() {
    
    // 페이지 로드 완료 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(init, 1000);
      });
      return;
    }

    // 네비게이션 감지 설정 (라우팅 처리 포함)
    setupNavigationListener();
  }

  // 스크립트 시작
  init();

})();
