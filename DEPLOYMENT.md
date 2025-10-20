# BeMore Frontend 배포 가이드

## 📦 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

---

## 🚀 Vercel 배포

### 1. Vercel CLI 설치 (선택사항)

```bash
npm install -g vercel
```

### 2. Vercel 배포

```bash
vercel
```

또는 GitHub 연동을 통한 자동 배포 (권장):
1. https://vercel.com 접속
2. GitHub 계정 연결
3. BeMoreFrontend 저장소 임포트
4. 자동 배포 설정 완료

### 3. 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정하세요:

```
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
```

⚠️ **중요**: 백엔드 URL을 실제 배포된 백엔드 주소로 변경하세요.

---

## 🌐 Netlify 배포 (대안)

### 1. Netlify CLI 설치

```bash
npm install -g netlify-cli
```

### 2. 배포

```bash
netlify deploy --prod
```

### 3. 환경변수 설정

Netlify 대시보드 → Site settings → Environment variables:

```
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
```

---

## 🔧 프로덕션 체크리스트

- [ ] 백엔드 URL이 올바르게 설정되었는지 확인
- [ ] 백엔드 CORS 설정에 프론트엔드 도메인 추가
- [ ] 환경변수가 올바르게 설정되었는지 확인
- [ ] 빌드 에러가 없는지 확인 (`npm run build`)
- [ ] HTTPS 사용 확인 (WebSocket은 WSS 프로토콜)

---

## 🐛 트러블슈팅

### WebSocket 연결 실패
- 백엔드가 WSS(HTTPS)를 지원하는지 확인
- CORS 설정에 프론트엔드 도메인이 포함되어 있는지 확인

### API 요청 실패
- 환경변수가 올바르게 설정되었는지 확인
- 백엔드 CORS 설정 확인
- 네트워크 탭에서 실제 요청 URL 확인

### 빌드 실패
- Node.js 버전 확인 (v18.20.4 이상)
- `npm install` 재실행
- `node_modules` 삭제 후 재설치
