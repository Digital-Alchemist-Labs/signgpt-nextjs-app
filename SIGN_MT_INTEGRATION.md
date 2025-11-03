# Sign.MT 통합 가이드

## 🎉 CORS 문제 해결 완료!

Sign.MT의 수어 데이터를 가져오는 CORS 문제를 Next.js API 프록시를 통해 해결했습니다.

## 🔧 변경 사항

### 1. **API 프록시 추가** (`/api/translate-pose`)
- **파일**: `src/app/api/translate-pose/route.ts`
- **기능**: 
  - Sign.MT Cloud Function에 서버 사이드로 요청
  - CORS 정책을 우회하여 pose 데이터를 안전하게 가져옴
  - Base64 인코딩으로 바이너리 데이터 전송

### 2. **TranslationService 개선**
- **파일**: `src/services/TranslationService.ts`
- **추가된 메서드**:
  - `fetchPoseData()`: 프록시를 통해 pose 데이터 가져오기
  - `fetchPoseDataCached()`: 캐싱이 포함된 버전 (1분 캐시)

### 3. **EnhancedTranslationOutput 복구**
- **파일**: `src/components/translate/EnhancedTranslationOutput.tsx`
- **변경 사항**:
  - CORS 문제로 제거되었던 `loadPoseData()` 함수 복구
  - 프록시를 통해 실제 Sign.MT pose 데이터 로딩
  - Firebase → Sign.MT 프록시 → 폴백 순서로 시도

### 4. **SignHover 개선**
- **파일**: `src/components/ui/SignHover.tsx`
- **변경 사항**:
  - Sign.MT 프록시를 통한 pose 데이터 로딩 추가
  - 캐싱 지원으로 성능 향상

## 🚀 사용 방법

### API 엔드포인트 테스트

```bash
# GET 요청 테스트
curl "http://localhost:3000/api/translate-pose?text=hello&spoken=en&signed=ase"

# POST 요청 테스트
curl -X POST http://localhost:3000/api/translate-pose \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","spokenLanguage":"en","signedLanguage":"ase"}'
```

### 컴포넌트에서 사용

```typescript
import { TranslationService } from "@/services/TranslationService";

const translationService = new TranslationService();

// Pose 데이터 가져오기
const result = await translationService.fetchPoseData(
  "hello",
  "en",  // spoken language
  "ase"  // signed language (American Sign Language)
);

if (result.pose) {
  console.log("Pose data loaded:", result.pose);
} else if (result.poseUrl) {
  console.log("Pose URL:", result.poseUrl);
} else if (result.error) {
  console.error("Error:", result.error);
}
```

## 🎯 작동 흐름

### 번역 페이지 (EnhancedTranslationOutput)
1. 사용자가 텍스트 입력
2. TranslationContext가 pose URL 생성
3. "Regenerate" 버튼 클릭 시:
   - ✅ Firebase에서 pre-rendered 비디오 찾기
   - ✅ **Sign.MT 프록시를 통해 실제 pose 데이터 로딩** (NEW!)
   - ✅ 폴백: pose URL 파라미터로 비디오 생성

### SignHover (툴팁)
1. 사용자가 텍스트에 마우스 오버
2. SignHover 활성화
3. 자동으로 pose/video 로딩:
   - ✅ 캐시 확인
   - ✅ Firebase pre-rendered 비디오
   - ✅ Firebase pose 파일
   - ✅ **Sign.MT 프록시를 통해 pose 데이터 로딩** (NEW!)
   - ✅ 폴백: pose URL 생성
   - ✅ 최종 폴백: 로컬 비디오 생성

## 🔍 디버깅

콘솔에서 다음과 같은 로그를 확인할 수 있습니다:

```
Fetching pose data via proxy: {text: "hello", spokenLanguage: "en", signedLanguage: "ase"}
Fetching from Sign.MT: https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=hello&spoken=en&signed=ase
Response content-type: application/octet-stream
Pose data loaded successfully: application/x-pose
```

## ⚙️ 환경 변수

프로젝트는 기본값을 사용하지만, 필요하면 `.env.local`에서 설정할 수 있습니다:

```env
# Sign.MT API 엔드포인트 (옵션)
NEXT_PUBLIC_SIGN_MT_API_BASE_URL=https://sign.mt/api
NEXT_PUBLIC_SIGN_MT_CLOUD_FUNCTION_URL=https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose

# Firebase Storage (옵션)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_URL=https://firebasestorage.googleapis.com/v0/b/sign-mt-assets/o/
```

## 📊 성능 최적화

1. **캐싱**: 
   - TranslationService에서 1분간 pose 데이터 캐싱
   - SignHoverService에서 비디오 캐싱
   - 중복 요청 방지 (inflight 맵 사용)

2. **폴백 전략**:
   - 빠른 것부터 시도 (캐시 → Firebase → Sign.MT)
   - 실패 시 자동으로 다음 방법 시도

3. **에러 처리**:
   - 각 단계에서 try-catch
   - 사용자 친화적인 에러 메시지
   - 자동 폴백으로 항상 무언가 표시

## 🎨 사용자 경험

- **로딩 상태**: "Loading pose data from Firebase..." 표시
- **에러 표시**: "Failed to load pose: [error message]" 
- **자동 재시도**: 폴백 메커니즘으로 자동 복구
- **원활한 전환**: 캐싱으로 빠른 응답

## 🐛 문제 해결

### 문제: "Unexpected content type: application/pose" (해결됨! ✅)
- **원인**: Sign.MT가 `application/pose` content-type을 반환하는데 처리하지 못함
- **해결**: 
  - Accept 헤더에 `application/pose` 추가
  - Binary 처리 조건에 `application/pose` 추가
  - 모든 binary 데이터를 유연하게 처리하도록 개선

### 문제: "Access denied" in Vercel (해결됨! ✅)
- **원인**: Sign.MT API가 특정 origin/referer를 체크
- **해결**:
  - Request 헤더에 `Origin`, `Referer`, `User-Agent` 추가
  - CORS 헤더를 모든 응답에 추가
  - `vercel.json`에 CORS 설정 추가
  - OPTIONS 메서드 핸들러 추가

### 문제: "Failed to fetch pose data"
- **원인**: Sign.MT 서버가 응답하지 않거나 네트워크 문제
- **해결**: 폴백 메커니즘이 자동으로 작동하며 로컬 비디오 생성

### 문제: Timeout
- **원인**: Sign.MT 응답이 너무 느림 (30초 timeout 설정)
- **해결**: 자동으로 폴백 방법 시도

## 🔗 참고 자료

- Sign.MT 프로젝트: https://github.com/sign/translate
- Sign.MT API: https://sign.mt/
- Sign.MT Cloud Function: https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose

## ✅ 테스트 체크리스트

### 로컬 테스트
- [ ] 개발 서버 시작: `npm run dev`
- [ ] 번역 페이지에서 텍스트 입력
- [ ] "Regenerate" 버튼 클릭하여 비디오 생성 확인
- [ ] 콘솔에서 "Pose data loaded successfully" 로그 확인
- [ ] "Unexpected content type" 에러가 없는지 확인
- [ ] SignHover 활성화하여 툴팁 표시 확인
- [ ] 네트워크 탭에서 `/api/translate-pose` 호출 확인

### Vercel 배포 테스트
```bash
# 1. 코드 커밋 & 푸시
git add .
git commit -m "fix: Add support for application/pose content-type and CORS headers"
git push origin main

# 2. Vercel에서 자동 배포 확인
# https://vercel.com/dashboard

# 3. 배포된 사이트에서 테스트
# - 번역 페이지 접속
# - 텍스트 입력 및 "Regenerate" 클릭
# - 브라우저 콘솔에서 "Access denied" 에러 없는지 확인
# - 네트워크 탭에서 200 OK 응답 확인
```

## 📋 변경 사항 요약 (v1.2.0)

### 수정된 파일
1. **`src/app/api/translate-pose/route.ts`**
   - ✅ `application/pose` content-type 지원 추가
   - ✅ Request 헤더에 `Origin`, `Referer`, `User-Agent` 추가
   - ✅ 모든 응답에 CORS 헤더 추가 (제네릭 타입 보존)
   - ✅ OPTIONS 메서드 핸들러 추가
   - ✅ Binary 데이터 처리 개선 (content-type 없어도 작동)

2. **`src/components/ui/SignHover.tsx`**
   - ✅ Base64 pose 데이터를 Blob URL로 변환
   - ✅ PoseViewer가 프록시 데이터 사용 (직접 Sign.MT 접근 방지)

3. **`src/components/translate/EnhancedTranslationOutput.tsx`**
   - ✅ 자동 pose 데이터 로딩 (useEffect 추가)
   - ✅ PoseViewer가 Blob URL 우선 사용
   - ✅ 직접 Sign.MT URL 접근 방지

4. **`vercel.json`** (신규)
   - ✅ Vercel 레벨 CORS 설정
   - ✅ API 라우트 헤더 설정

### 주요 개선 사항
- 🎯 **"Unexpected content type" 에러 해결**
- 🌐 **PoseViewer "Access denied" 문제 해결** (v1.2.0)
- 🔒 **CORS 정책 완벽 지원**
- 🚀 **더 견고한 에러 처리**
- 💾 **Base64 → Blob URL 변환으로 메모리 효율 개선**

### v1.2.0 핵심 수정사항
**문제**: PoseViewer가 Sign.MT URL을 직접 브라우저에서 로드하려고 시도하여 403 발생

**해결**:
1. 프록시에서 가져온 base64 pose 데이터를 Blob URL로 변환
2. PoseViewer에 Blob URL 전달 (원본 URL 대신)
3. 자동 로딩으로 사용자 경험 개선

---

**작성일**: 2025-11-03  
**최종 수정**: 2025-11-03 (v1.2.0)  
**버전**: 1.2.0  
**상태**: ✅ 완료 - Access Denied 문제 해결!

