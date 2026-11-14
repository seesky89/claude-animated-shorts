# Changelog & Development History

<!-- 
🤖 AI AGENT RULES FOR MAINTAINING EXCELLENCE: 
1. Record ALL future modifications in this file. 
2. Use Semantic Versioning: [vMajor.Minor.Patch] - YYYY-MM-DD. 
3. Start at 1.0.0. Increment `patch` by 1 for every change. 
4. If `patch` reaches 99, increment `minor` by 1 and reset `patch` to 0. 
5. Record upcoming tasks in the Backlog section. When completely implemented, REMOVE them from the Backlog and MOVE them down to the Version History!
-->

## 📌 향후 설계/작업 예정 (Backlog & TODOs)
> 프로젝트의 장기적인 방향성과 추가할 기능/아이디어들을 이곳에 기록합니다.
> AI 시스템(Antigravity 등)은 작업 시작 전 이 백로그를 항상 숙지합니다.

- [ ] (CLI 기능) `shorts web` - 로컬 웹 브라우저 기반 실시간 3D 씬 및 카메라 조작 GUI 뷰어
- [ ] (Voice 고도화) Whisper 모델 파라미터 선택 옵션(`--whisper-model tiny|base|small`) 및 다국어 지원
- [ ] (포스트프로세싱) 사용자 정의 LUT 컬러 그레이딩 및 계절별 룩 프리셋 추가
- [ ] (에셋 관리) Kenney CC0 에셋 자동 다운로더 및 3D 모델 최적화 파이프라인

---

## [v2.0.2] - 2026-11-14
### Added
- **원클릭 전자동 빌드 명령어 (`shorts build`) 추가**:
  - `shorts voice`, `shorts audio`, `shorts render`, `shorts qa`를 매번 사람이 개별 실행할 필요 없이, 대본 작성 후 단 한 번의 명령어로 최종 2K 비디오 제작까지 원스톱으로 완주하는 `shorts build <project-name> [--2k]` 파이프라인 추가.
- **버전 동기화**: `package.json` (v2.0.2) 동기화 완료.

---

## [v2.0.1] - 2026-11-14
### Fixed
- **npm install ERESOLVE peer 의존성 충돌 해결**:
  - `packages/core/package.json` 및 루트 `package.json`에 `overrides` 필드를 추가하고 `postprocessing`을 `6.36.4`로 고정하여, npm 7+ 환경에서 `three@0.166.1`과 최신 postprocessing 버전 간의 피어 의존성 충돌(`ERESOLVE unable to resolve dependency tree`) 원천 차단.
- **씬 파일 모듈 임포트 경로 및 TS 타입 검증 통과**:
  - `projects/bridge-1831/scene/`의 `build.ts`, `cast.ts`, `world.ts`에서 코어 셰이더 및 툰 드로잉 엔진을 `@shaders/*` 및 `@toon/*` 경로로 정상 참조하도록 수정.
  - `CartoonScene.tsx`의 postprocessing 프래그먼트 반환 타입을 보강하여 `tsc --noEmit` 검증 0 에러 달성.
- **버전 동기화**: `package.json` (v2.0.1) 동기화 완료.

---

## [v2.0.0] - 2026-11-14
### Added & Refactored (독립 CLI 프레임워크 전환)
- **독립형 CLI 프레임워크(`shorts`) 구축**:
  - LLM 에이전트의 수작업 복제에 의존하던 Agent Skill 구조에서 탈피하여 완전 독립형 CLI 엔진으로 전면 개편.
  - 통합 명령어 제공:
    - `shorts new <name>`: 수십 KB 수준의 최소 쇼츠 프로젝트 디렉토리 자동 생성
    - `shorts voice <name>`: 대본(`SCRIPT.md`) 기반 TTS 음성 및 `words.json` 단어 정렬 원클릭 생성
    - `shorts audio <name>`: BGM Ducking 및 SFX 합성 `mix.wav` 생성
    - `shorts preview <name> [frames]`: 3D 씬 스틸컷 프리뷰 렌더링
    - `shorts render <name> [--2k]`: 1080x1920 또는 2K 비디오 최종 렌더링 및 `ffmpeg` 오디오 먹싱
    - `shorts qa <name>`: 무결성 및 -15 LUFS 라우드니스 QA 검증
    - `shorts clean`: Remotion 임시 Webpack 번들 캐시 안전 정리
- **모노레포 패키지 아키텍처 개편**:
  - `packages/core`: Three.js 셰이더(`ink`, `lensblur`, `grade`, `toon`, `cardshade`, `lights`, `paint`) 및 Remotion 렌더러 중앙화
  - `packages/audio`: Python DSP 및 신디사이저 엔진(`cartoon_audio`) 패키징
  - `packages/voice`: 무료 고품질 `edge-tts` (Azure Neural Voice) 및 Energy VAD / Whisper 단어 타임스탬프 자동화 파이프라인 구축
- **자원 중복 95% 제거**:
  - 쇼츠마다 수백 MB ~ 1GB씩 생성되던 `node_modules`와 오디오 파이썬 스크립트 중복을 완전히 제거하고, 프로젝트 디렉토리를 50 KB 수준의 순수 연출 데이터(`story.ts`, `SCRIPT.md`)만으로 경량화.
- **버전 동기화**: `package.json` (v2.0.0) 동기화 완료.

---

## [v1.0.0] - 2026-11-14
### Initial Release
- **The Bridge That Fell for a Song (오리지널 릴리스)**:
  - Claude Code용 Agent Skill(`SKILL.md`) 기반의 애니메이션 쇼츠 제작 파이프라인.
  - Three.js + Remotion 기반 2D-in-3D 툰 렌더링, 잉크 아웃라인, 렌즈 블러, 그레이딩 셰이더.
  - Python 기반 DSP 및 군악대 마치 스코어 합성 엔진.
