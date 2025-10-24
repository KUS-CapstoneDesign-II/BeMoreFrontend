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

### 3. 환경변수/브랜치 매핑

Vercel 대시보드에서 환경변수와 브랜치 매핑을 설정하세요:

프로젝트 Settings → Environments:

- Development (PR Preview):
  - Branch: Pull Requests
  - `VITE_API_URL=https://api.stage.example.com`
  - `VITE_WS_URL=wss://api.stage.example.com`
- Preview (develop → stage):
  - Branch: develop
  - 동일한 Stage 값을 사용
- Production (main → prod):
  - Branch: main
  - `VITE_API_URL=https://api.prod.example.com`
  - `VITE_WS_URL=wss://api.prod.example.com`

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
 - [ ] CSP 위반 없음(브라우저 콘솔 확인)
 - [ ] Preview/Stage/Prod 브랜치 매핑 정상 동작

---

## 🧰 On‑Prem 배포 (Docker + NGINX)

### 1. 이미지 빌드

```bash
docker build -t bemore-frontend:latest .
```

### 2. 컨테이너 실행 (런타임 환경변수 주입)

```bash
docker run -d -p 8080:80 \
  -e API_URL=https://backend.example.com \
  -e WS_URL=wss://backend.example.com \
  --name bemore-frontend bemore-frontend:latest
```

### 3. NGINX 헤더

`docker/nginx.conf`에서 CSP/보안 헤더를 관리합니다.

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
