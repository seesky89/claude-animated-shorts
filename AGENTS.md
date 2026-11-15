# AI Agent Guidelines & Project Rules (`dev_shared_skill`)

본 문서는 모든 AI 에이전트(Antigravity, Cursor, Claude Code, Gemini CLI 등)가 **Cartoon 3D Short Shared Runtime (`cartoon-3d-short-shared`)** 프로젝트 작업을 수행할 때 반드시 준수해야 하는 행동 지침, 버전 관리 및 Git 규칙입니다.

---

## 📌 0. 필수 선행 작업 (Pre-execution Rules)
1. **버전 및 변경 내역 파악**:
   - 작업을 시작하기 전 프로젝트 루트의 `CHANGELOG.md` 파일을 먼저 읽고 현재 버전을 파악한 뒤 코딩을 시작한다.
2. **백로그 숙지**:
   - `CHANGELOG.md`의 `## 📌 향후 설계/작업 예정 (Backlog & TODOs)` 섹션을 항상 확인하고 현재 작업 맥락과 연계한다.
3. **응답 언어**:
   - 사용자와의 모든 소통 및 응답은 한국어로 진행한다.
4. **공유 런타임 구조 준수**:
   - 본 브랜치는 `cartoon-3d-short-shared` 스킬(`SKILL.md`)을 사용한다.
   - 공통 의존성(`runtime/remotion/node_modules`), 3D/셰이더/툰 코어(`runtime/remotion/src/core/`), 공유 에셋(`runtime/remotion/public/`), 오디오 DSP 엔진(`runtime/audio/`)은 모든 쇼츠가 공유한다.
   - 새 쇼츠는 반드시 `python runtime/scripts/init_short.py <name>`으로 `shorts/<name>/` 하위에 생성하며, 프로젝트별로 `node_modules`나 코어 엔진 파일을 복제하지 않는다.

---

## 🎯 1. 품질 기준 (Rendering & Audio Quality)
- **Three.js / Remotion**:
  - 포스트프로세싱 합성 순서(`ink -> lens pre -> lens main -> bloom -> tone -> grade`)를 유지한다.
  - 빌보드 캐릭터 및 이펙트 카드는 항상 `NOINK` 레이어에 배치한다.
  - 스틸/렌더 실행 시 `runtime/scripts/stills.mjs` 및 `render.mjs`를 사용하여 임시 번들(`remotion-webpack-bundle-*`)을 자동 정리한다.
- **Audio DSP**:
  - 오디오 샘플레이트 48 kHz (24-bit PCM), 통합 라우드니스 -15.0 LUFS, `words.json` 발화 구간 BGM Ducking(-3 dB)을 유지한다.

---

## 🏷️ 2. 버전 관리 규칙 (Versioning & CHANGELOG Convention)
- **Semantic Versioning 준수**:
  - 버전 포맷: `[vMajor.Minor.Patch] - YYYY-MM-DD`
  - 기능 추가, 수정, 리팩토링, 문서 변경 등 의미 있는 작업이 완료될 때마다 `patch` 번호를 1씩 증가시킨다. (예: `v1.0.2` ➡️ `v1.0.3`)
  - `patch`가 99에 도달하면 `minor`를 1 올리고 `patch`를 0으로 리셋한다.
- **버전 동기화 (Essential)**:
  - `CHANGELOG.md`의 버전 갱신 시 `runtime/remotion/package.json`의 `"version"` 값도 항상 일치시킨다.
- **백로그(Backlog & TODOs) 관리**:
  - 예정된 작업은 `CHANGELOG.md`의 `## 📌 향후 설계/작업 예정 (Backlog & TODOs)`에 기록하고, 완료 시 버전 이력(Version History)으로 이동한다.

---

## 🚨 3. Git 커밋 및 명령어 규칙 (Git Rules & Commit Convention)
- ⛔ **Git Write 관련 명령어 실행 절대 금지 (AI 필수 준수)**:
  - AI는 `git status`, `git log`, `git diff`, `git branch` 등 **단순 조회(Read-only) 명령어만 실행 가능**하다. (단, 사용자가 명시적으로 브랜치 생성 및 커밋을 요청한 경우 제외)
  - 작업 완료 후에는 사용자가 직접 실행할 수 있도록 커밋 명령어 블록을 제공한다.
- 🚨 **작업 완료 후 커밋 명령어 필수 제공 규칙 (AI 예외 없이 무조건 준수)**:
  - **코드 수정이나 파일 생성/변경이 발생한 모든 작업 응답의 최하단에는 예외 없이 무조건 사용자가 복사할 수 있는 Git 커밋 명령어(`git add`, `git commit -m "..."`)를 코드 블록으로 반드시 제공해야 한다.**
  - 이 규칙을 누락하는 것은 작업 미완료로 간주한다.
  - 커밋 메시지 형식은 반드시 **`type(v버전): 한글 요약 설명`** 형태를 유지한다.
  - **커밋 타입**: `feat`, `fix`, `refactor`, `docs`, `chore`
