# Vercel 배포 가이드

## 🚀 빠른 배포

### 1. Git에 푸시
```bash
git add .
git commit -m "fix: Add support for application/pose content-type and CORS headers"
git push origin main
```

### 2. Vercel이 자동으로 배포합니다!
- Vercel이 GitHub 저장소를 모니터링하고 있다면 자동 배포됩니다
- 약 2-3분 소요

### 3. 배포 확인
```
https://vercel.com/dashboard
```

---

## 🔧 환경변수 설정 (선택사항)

현재 프로젝트는 기본값이 잘 설정되어 있어서 **추가 환경변수 없이도 작동**합니다.

하지만 커스터마이징이 필요하다면:

### Vercel Dashboard에서 설정
1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 아래 변수 추가 (필요시만):

```bash
# Sign.MT 엔드포인트 (기본값 있음)
NEXT_PUBLIC_SIGN_MT_CLOUD_FUNCTION_URL
= https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose

# Firebase Storage (기본값 있음)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_URL
= https://firebasestorage.googleapis.com/v0/b/sign-mt-assets/o/

# 서버 사이드 API (Production에서 필요하면)
SIGNGPT_CLIENT_URL
= https://your-api-server.com

WEBSOCKET_URL
= wss://your-websocket-server.com/ws
```

4. **Save** 클릭
5. **Deployments** → 최신 배포 옆 **⋯** → **Redeploy**

---

## ✅ 배포 후 테스트

### 1. 사이트 접속
```
https://your-app.vercel.app
```

### 2. 번역 페이지 테스트
1. 번역 페이지로 이동
2. 텍스트 입력 (예: "hello")
3. "Regenerate" 버튼 클릭
4. 수어 비디오가 생성되는지 확인

### 3. 브라우저 콘솔 확인
- F12 → Console 탭
- ✅ "Pose data loaded successfully" 메시지 확인
- ❌ "Access denied" 에러 **없어야** 함
- ❌ "Unexpected content type" 에러 **없어야** 함

### 4. 네트워크 탭 확인
- F12 → Network 탭
- `/api/translate-pose` 요청 찾기
- Status: **200 OK** 확인
- Response에 `pose` 데이터 확인

---

## 🐛 문제 해결

### "Access denied" 에러가 여전히 발생하는 경우

**원인**: Vercel 배포가 업데이트되지 않았을 수 있음

**해결**:
```bash
# 1. 캐시 클리어 후 재배포
# Vercel Dashboard → Deployments → Redeploy
# ⚠️ "Use existing Build Cache" 체크 **해제**

# 2. 또는 강제 푸시
git commit --allow-empty -m "chore: force redeploy"
git push origin main
```

### "Unexpected content type" 에러

**확인사항**:
1. `src/app/api/translate-pose/route.ts` 파일이 최신 버전인지 확인
2. Line 86에 `contentType?.includes("application/pose")` 있는지 확인
3. Line 56에 Accept 헤더에 `application/pose` 있는지 확인

### 로컬에서는 되는데 Vercel에서 안 되는 경우

**확인사항**:
1. `vercel.json` 파일이 프로젝트 루트에 있는지 확인
2. Vercel 빌드 로그 확인:
   ```
   Vercel Dashboard → Deployments → 클릭 → View Build Logs
   ```
3. 환경변수 확인:
   ```
   Vercel Dashboard → Settings → Environment Variables
   ```

---

## 📊 배포 상태 확인

### Vercel CLI로 확인
```bash
# Vercel CLI 설치 (한 번만)
npm i -g vercel

# 로그인
vercel login

# 배포 목록 확인
vercel ls

# 최신 배포 로그 확인
vercel logs
```

### GitHub Actions (설정되어 있다면)
```
GitHub 저장소 → Actions 탭
```

---

## 🎯 성능 확인

배포 후 성능 확인:

```bash
# Lighthouse 점수 확인
npm run build
npm start

# 또는 Vercel Analytics 확인
# Vercel Dashboard → Analytics
```

---

## 📝 체크리스트

배포 전:
- [ ] 모든 변경사항 커밋
- [ ] `npm run build` 로컬 빌드 테스트
- [ ] Linter 에러 없음 확인

배포 후:
- [ ] Vercel 빌드 성공 확인
- [ ] 사이트 접속 확인
- [ ] 번역 기능 테스트
- [ ] 콘솔 에러 없음 확인
- [ ] 네트워크 200 OK 확인

---

## 🔗 유용한 링크

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel 배포 문서](https://vercel.com/docs/deployments/overview)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Sign.MT Integration 가이드](./SIGN_MT_INTEGRATION.md)

---

**버전**: 1.0  
**최종 수정**: 2025-11-03

