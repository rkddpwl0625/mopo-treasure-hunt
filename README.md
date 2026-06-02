# 🎮 목포 시화마을 보물찾기

시화마을 투어용 야외 방탈출 게임(보물찾기) 웹 애플리케이션입니다.

## 🚀 시작하기

### 필수 요구사항
- Node.js 16+ 
- npm 또는 yarn
- Firebase 프로젝트 (무료 버전)

### 1️⃣ Firebase 설정

#### Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com)에 접속
2. "새 프로젝트 만들기" 클릭
3. 프로젝트명 입력 (예: "mopo-treasure-hunt")
4. 프로젝트 생성

#### Firestore 데이터베이스 활성화
1. Firebase Console에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 모드: **테스트 모드** 선택 (개발용)
4. 위치: **asia-northeast1** (서울) 선택
5. "만들기" 클릭

#### Cloud Storage 활성화
1. Firebase Console에서 "Storage" 선택
2. "시작" 클릭
3. **테스트 모드** 선택
4. "다음" → "완료"

#### Firebase 설정값 복사
1. Firebase Console에서 프로젝트 설정 (⚙️) 클릭
2. "일반" 탭에서 앱 등록
3. Firebase SDK 설정 코드에서 다음 값들을 복사:
   ```
   apiKey
   authDomain
   projectId
   storageBucket
   messagingSenderId
   appId
   ```

### 2️⃣ 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정하고 위에서 복사한 값들 입력
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3️⃣ 초기 설정 데이터 추가

Firebase Console의 Firestore에서 다음 문서를 생성:

**Collection: `settings`**
```
Document ID: admin
Fields:
  adminCode (string): "admin123" (원하는 관리자 코드로 변경)
```

### 4️⃣ 프로젝트 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

## 📋 Firestore 보안 규칙 (선택사항)

`Firestore Database` → `규칙` 탭에서 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read: if true;
      allow write: if false;
    }
    match /games/{gameId}/questions/{questionId} {
      allow read: if true;
      allow write: if false;
    }
    match /games/{gameId}/participants/{participantId} {
      allow read, write: if true;
    }
    match /settings/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 🎮 사용 방법

### 참가자
1. 메인 페이지에서 "참가하기" 클릭
2. 입장 코드 입력
3. 기수, 조, 멤버이름 입력
4. 게임 시작!

### 관리자
1. 메인 페이지에서 "관리자" 클릭
2. 관리자 코드 입력
3. 게임 만들기 또는 기존 게임 선택
4. 문제, 답, 힌트 설정
5. 참여 현황 모니터링

## 📦 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### Vercel에 배포
1. [Vercel](https://vercel.com)에 GitHub 계정으로 접속
2. "Import Project" 클릭
3. GitHub 레포지토리 선택
4. Environment Variables 추가:
   - `VITE_FIREBASE_API_KEY` 등 모든 Firebase 설정값
5. Deploy 클릭

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Backend**: Firebase (Firestore, Storage)
- **Build Tool**: Vite
- **Routing**: React Router v6

## 📱 주요 기능

### 참가자
- ✅ 입장 코드로 게임 접근
- ✅ 7개 문제 순차 풀이
- ✅ 단계별 힌트 제공
- ✅ 실시간 순위 확인
- ✅ 소요 시간 자동 기록

### 관리자
- ✅ 게임 생성 및 관리
- ✅ 문제 편집 (이미지 업로드 지원)
- ✅ 단계별 힌트 설정
- ✅ 참여자 현황 실시간 모니터링
- ✅ 게임 데이터 초기화

## 🎯 게임 구조

각 게임은:
- 7개의 문제
- 각 문제마다:
  - 제목 (필수)
  - 설명 (선택)
  - 이미지 (선택)
  - 정답 (필수)
  - 단계별 힌트 (선택)

## 💡 팁

1. **정답 검증**: 공백 무시, 대소문자 구분 없음
2. **이미지**: Firebase Storage에 자동 업로드
3. **모바일**: 반응형 디자인으로 모든 기기 지원
4. **실시간**: Firestore의 onSnapshot으로 실시간 업데이트

## 🤝 지원

문제나 기능 요청은 GitHub Issues로 등록해주세요.
