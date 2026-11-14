# AI Agent Guidelines & Project Rules

본 문서는 모든 AI 에이전트(Antigravity, Cursor, Claude Code, Gemini CLI 등)가 **Claude Animated Shorts (Hybrid Hub)** 프로젝트 작업을 수행할 때 반드시 준수해야 하는 행동 지침, 코딩 표준, 버전 관리 및 Git 규칙입니다.

---

## 📌 0. 필수 선행 작업 (Pre-execution Rules)
1. **버전 및 변경 내역 파악**:
   - 작업을 시작하기 전 무조건 프로젝트 루트의 `CHANGELOG.md` 파일을 먼저 읽고 현재 버전을 파악한 뒤 코딩을 시작한다.
2. **백로그 숙지**:
   - `CHANGELOG.md`의 `## 📌 향후 설계/작업 예정 (Backlog & TODOs)` 섹션을 항상 확인하고 현재 작업 맥락과 연계한다.
3. **응답 언어**:
   - 사용자와의 모든 소통 및 응답은 한국어로 진행한다.
4. **프로젝트 환경 인지**:
   - 본 프로젝트는 단일 중앙 `hub/remotion` 및 `hub/audio`를 기반으로 다수의 경량 쇼츠(`projects/<name>`)를 구동하는 하이브리드 허브 아키텍처이다.

---

## 🧠 1. 구현 전 사고 (Think Before Coding)
가정하지 않는다. 모호함을 숨기지 않는다. 트레이드오프를 명확히 밝힌다.

- 자신의 가정을 명시적으로 기술한다. 불확실한 경우 질문한다.
- 해석의 여지가 여러 가지라면 임의로 선택하지 말고 대안들을 제시한다.
- 더 간단한 접근 방식이 있다면 제안한다. 정당한 사유가 있다면 사용자의 요청에 반대 의견을 제시한다.
- 불분명한 부분이 있다면 작업을 중단한다. 혼란스러운 부분을 구체적으로 언급하며 질문한다.

---

## 💡 2. 단순성 우선 (Simplicity First)
- 문제를 해결하는 최소한의 코드만 작성한다. 추측에 기반한 코드는 배제한다.
- 쇼츠 디렉토리(`projects/<name>`)에 중복된 `node_modules`나 DSP 파이썬 파일을 생성하지 않고, 무조건 중앙 `hub/`를 참조한다.
- "시니어 그래픽스/사운드 엔지니어가 보기에 이 코드가 지나치게 복잡한가?"라고 자문하고 단순화한다.

---

## 🔍 3. 정밀한 수정 (Surgical Changes)
필요한 부분만 수정한다. 본인이 만든 코드의 뒷정리만 수행한다.

- 인접한 코드, 주석, 포맷을 임의로 개선하지 않는다.
- 망가지지 않은 부분을 리팩토링하지 않는다.
- 수정으로 인해 불필요해진 import, 변수, 함수는 깨끗이 제거한다.

---

## 🎯 4. 목표 중심 실행 및 품질 검증
- **Three.js / Remotion 품질 규칙**:
  - Three.js 셰이더는 항상 `hub/remotion/src/core/`에서 공통으로 관리한다.
  - 빌보드 캐릭터 카드는 항상 `NOINK` 레이어(Layer 3)에 등록한다.
  - 임시 번들 생성 시 `REMOTION_TMP` 환경 변수를 사용한다.
- **Audio DSP 품질 규칙**:
  - 오디오 샘플레이트 48 kHz (24-bit PCM) 준수.
  - 최종 믹스는 -15.0 LUFS 규격을 유지하며, `words.json` 발화 구간에 BGM Ducking (-3 dB)을 보장한다.

---

## 🏷️ 5. 버전 관리 규칙 (Versioning & CHANGELOG Convention)
- **Semantic Versioning 준수**:
  - 버전 포맷: `[vMajor.Minor.Patch] - YYYY-MM-DD`
  - 기능 추가, 수정, 리팩토링 등 의미 있는 작업이 완료될 때마다 `patch` 번호를 1씩 증가시킨다. (예: `v1.1.0` ➡️ `v1.1.1`)
  - `patch`가 99에 도달하면 `minor`를 1 올리고 `patch`를 0으로 리셋한다.
- **버전 동기화 (Essential)**:
  - `CHANGELOG.md`의 버전 갱신 시 `hub/remotion/package.json`의 `version` 값도 항상 일치시킨다.
- **백로그(Backlog & TODOs) 관리**:
  - 예정된 작업은 `CHANGELOG.md`의 `## 📌 향후 설계/작업 예정 (Backlog & TODOs)`에 기록해둔다.
  - 구현이 완료되면 백로그 체크박스를 지우거나 해당 항목을 버전 이력(Version History) 하위로 이동한다.

---

## 🚨 6. Git 커밋 및 명령어 규칙 (Git Rules & Commit Convention)
- ⛔ **Git Write 관련 명령어 실행 절대 금지 (AI 필수 준수)**:
  - AI는 `git status`, `git log`, `git diff`, `git branch` 등 **단순 조회(Read-only) 명령어만 실행 가능**하다.
  - 통상 작업 완료 후에는 사용자가 직접 실행할 수 있도록 명령어 블록을 제공한다.
- 🚨 **작업 완료 후 커밋 명령어 필수 제공 규칙 (AI 예외 없이 무조건 준수)**:
  - **코드 수정이나 파일 생성/변경이 발생한 모든 작업 응답의 최하단에는 예외 없이 무조건 사용자가 복사할 수 있는 Git 커밋 명령어(`git add`, `git commit -m "..."`)를 코드 블록으로 반드시 제공해야 한다.**
  - 이 규칙을 누락하는 것은 작업 미완료로 간주한다.
  - 커밋 메시지 형식: **`type(v버전): 한글 요약 설명`**
  - **커밋 타입 예시**: `feat`, `fix`, `refactor`, `docs`, `chore`
