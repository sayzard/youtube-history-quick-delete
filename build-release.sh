#!/bin/bash

# 크롬 웹 스토어 릴리스 패키지 생성 스크립트

echo "🚀 크롬 웹 스토어 릴리스 패키지 생성 중..."
echo ""

# manifest.json에서 버전 읽기
VERSION=$(grep -o '"version": "[^"]*' manifest.json | grep -o '[^"]*$')
echo "📦 버전: $VERSION"
echo ""

# 빌드 디렉토리 생성
BUILD_DIR="build"
PACKAGE_NAME="youtube-history-quick-delete-v${VERSION}"
RELEASE_DIR="${BUILD_DIR}/${PACKAGE_NAME}"

# 기존 빌드 디렉토리 제거
if [ -d "$BUILD_DIR" ]; then
  echo "🧹 기존 빌드 디렉토리 삭제 중..."
  rm -rf "$BUILD_DIR"
fi

# 새 빌드 디렉토리 생성
echo "📁 빌드 디렉토리 생성 중..."
mkdir -p "$RELEASE_DIR"

# 필요한 파일 복사
echo "📋 파일 복사 중..."

# manifest.json
cp manifest.json "$RELEASE_DIR/"
echo "  ✅ manifest.json"

# content 폴더
cp -r content "$RELEASE_DIR/"
echo "  ✅ content/"

# assets 폴더 (필요한 파일만)
mkdir -p "$RELEASE_DIR/assets"

# PNG 아이콘 복사 (있는 경우)
if [ -f "assets/icon-16.png" ]; then
  cp assets/icon-16.png "$RELEASE_DIR/assets/"
  echo "  ✅ assets/icon-16.png"
else
  echo "  ⚠️  assets/icon-16.png 없음 (먼저 생성하세요!)"
fi

if [ -f "assets/icon-48.png" ]; then
  cp assets/icon-48.png "$RELEASE_DIR/assets/"
  echo "  ✅ assets/icon-48.png"
else
  echo "  ⚠️  assets/icon-48.png 없음 (먼저 생성하세요!)"
fi

if [ -f "assets/icon-128.png" ]; then
  cp assets/icon-128.png "$RELEASE_DIR/assets/"
  echo "  ✅ assets/icon-128.png"
else
  echo "  ⚠️  assets/icon-128.png 없음 (먼저 생성하세요!)"
fi

# README와 LICENSE (선택사항)
if [ -f "README.md" ]; then
  cp README.md "$RELEASE_DIR/"
  echo "  ✅ README.md"
fi

if [ -f "LICENSE" ]; then
  cp LICENSE "$RELEASE_DIR/"
  echo "  ✅ LICENSE"
fi

echo ""
echo "🗜️  ZIP 파일 생성 중..."

# 빌드 디렉토리로 이동하여 ZIP 생성
cd "$BUILD_DIR"
zip -r "${PACKAGE_NAME}.zip" "$PACKAGE_NAME" > /dev/null

cd ..

echo ""
echo "✅ 릴리스 패키지 생성 완료!"
echo ""
echo "📦 패키지 정보:"
echo "  - 버전: $VERSION"
echo "  - 파일: ${BUILD_DIR}/${PACKAGE_NAME}.zip"
echo "  - 크기: $(du -h "${BUILD_DIR}/${PACKAGE_NAME}.zip" | cut -f1)"
echo ""
echo "📋 다음 단계:"
echo "  1. ${BUILD_DIR}/${PACKAGE_NAME}.zip 파일을 확인하세요"
echo "  2. Chrome Web Store Developer Dashboard에 업로드하세요"
echo "     https://chrome.google.com/webstore/devconsole"
echo ""
echo "⚠️  아이콘 파일이 없다면:"
echo "  1. assets/convert-icon-to-png.html을 브라우저에서 열기"
echo "  2. icon.svg를 업로드하여 PNG 생성"
echo "  3. 생성된 PNG 파일들을 assets/ 폴더에 저장"
echo "  4. 다시 이 스크립트 실행"
echo ""

# 패키지 내용 표시
echo "📂 패키지 내용:"
unzip -l "${BUILD_DIR}/${PACKAGE_NAME}.zip" | tail -n +4 | sed '$d' | sed '$d'
echo ""

