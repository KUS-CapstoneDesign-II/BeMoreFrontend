#!/bin/bash

# 테스트 계정 검증 스크립트
# CI/CD Secrets 설정 전에 계정이 정상 작동하는지 확인

set -e

echo "========================================"
echo "🔍 테스트 계정 검증 스크립트"
echo "========================================"
echo ""

# 환경 변수 확인
if [ -z "$TEST_EMAIL" ]; then
  echo "❌ TEST_EMAIL 환경 변수가 설정되지 않았습니다."
  echo ""
  echo "사용 방법:"
  echo "  TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword ./scripts/verify-test-account.sh"
  exit 1
fi

if [ -z "$TEST_PASSWORD" ]; then
  echo "❌ TEST_PASSWORD 환경 변수가 설정되지 않았습니다."
  echo ""
  echo "사용 방법:"
  echo "  TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword ./scripts/verify-test-account.sh"
  exit 1
fi

API_URL="${VITE_API_URL:-https://bemorebackend.onrender.com}"
APP_URL="${VITE_APP_URL:-https://be-more-frontend.vercel.app}"

echo "📋 설정 정보:"
echo "  API URL: $API_URL"
echo "  APP URL: $APP_URL"
echo "  TEST_EMAIL: $TEST_EMAIL"
echo "  TEST_PASSWORD: ******* (숨김)"
echo ""

# 백엔드 Health Check
echo "1️⃣ 백엔드 서버 확인..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/" || echo "000")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo "   ✅ 백엔드 서버 정상 (HTTP 200)"
else
  echo "   ⚠️  백엔드 서버 응답: HTTP $HEALTH_CODE"
  echo "   (콜드 스타트 가능성 있음, 계속 진행...)"
fi
echo ""

# 로그인 테스트
echo "2️⃣ 로그인 테스트..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  || echo '{"success":false}
000')

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)

echo "   HTTP Status: $LOGIN_CODE"

if [ "$LOGIN_CODE" = "200" ]; then
  # JSON 파싱 (jq가 있으면 사용, 없으면 간단한 grep)
  if command -v jq &> /dev/null; then
    SUCCESS=$(echo "$LOGIN_BODY" | jq -r '.success // false')
    if [ "$SUCCESS" = "true" ]; then
      ACCESS_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.data.accessToken // ""' | cut -c1-20)
      echo "   ✅ 로그인 성공!"
      echo "   📝 accessToken: ${ACCESS_TOKEN}... (일부)"
    else
      ERROR_MSG=$(echo "$LOGIN_BODY" | jq -r '.error.message // "알 수 없는 에러"')
      echo "   ❌ 로그인 실패: $ERROR_MSG"
      exit 1
    fi
  else
    # jq가 없을 때 간단한 확인
    if echo "$LOGIN_BODY" | grep -q '"success":true'; then
      echo "   ✅ 로그인 성공!"
    else
      echo "   ❌ 로그인 실패"
      echo "   응답: $LOGIN_BODY"
      exit 1
    fi
  fi
else
  echo "   ❌ 로그인 실패: HTTP $LOGIN_CODE"
  echo "   응답: $LOGIN_BODY"
  exit 1
fi
echo ""

# 최종 확인
echo "========================================"
echo "✅ 테스트 계정 검증 완료!"
echo "========================================"
echo ""
echo "다음 단계:"
echo "1. GitHub Repository Settings → Secrets and variables → Actions"
echo "2. 다음 4개 Secrets 추가:"
echo "   - VITE_APP_URL: $APP_URL"
echo "   - VITE_API_URL: $API_URL"
echo "   - TEST_EMAIL: $TEST_EMAIL"
echo "   - TEST_PASSWORD: $TEST_PASSWORD"
echo ""
echo "3. GitHub Actions 탭에서 워크플로우 수동 실행"
echo ""
echo "📚 상세 가이드: docs/CI_CD_ACTIVATION_GUIDE.md"
echo ""
