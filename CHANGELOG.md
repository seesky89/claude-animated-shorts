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

- [ ] (렌더 파이프라인) 프로젝트별 오디오-비디오 자동 Muxing 스크립트 추가
- [ ] (셰이더 확장) 계절별 조명 프리셋 및 컬러 그레이딩 LUT 프리셋 확충
- [ ] (에셋 관리) Kenney CC0 에셋 자동 동기화 도구 마련

---

## [v1.1.2] - 2026-11-14
### Fixed & Improved (3D 렌더링 엔진 안정화 및 WebGL 누수 방지 이식)
- **Remotion 3D 렌더링 파이프라인 동적 번들링 및 최적화 (`hub/remotion/`)**:
  - **WebGL Context 누수 방지 (`CartoonScene.tsx`)**: 샷 전환 시 `ThreeCanvas`의 불필요한 재생성을 방지하기 위해 `key={i ? "over" : "base"}` 캔버스 재사용 구조를 적용하여, 1,300 프레임 부근에서 브라우저 WebGL Context 한도(16개) 초과로 발생하던 Context Loss 크래시 원천 차단.
  - **R3F 샷 컷 Unmount Dispose 보호 (`CartoonScene.tsx`)**: 샷 전환(130 프레임) 시 `@react-three/fiber`가 `<primitive dispose={null}>`을 unmount할 때 `dispose` 참조를 덮어써 발생하던 `TypeError: fx.ink.dispose is not a function` 크래시를 방지하기 위해 클로저 캡처 및 예외 안전 가드 적용.
  - **동적 프로젝트 번들링 스크립트 고도화 (`scripts/render.mjs`, `scripts/stills.mjs`)**: Webpack alias(`@current-project`)를 통해 Hub 엔진을 재빌드하지 않고도 `projects/<name>`의 3D 씬을 즉시 마운트하여 렌더링할 수 있도록 지원.
  - **순차 인코딩(`concurrency: 1`) 및 Chromium 안정화 플래그 적용**: WebGL 멀티프로세스 파이프 충돌(`write EOF`) 방지.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.2) 동기화 완료.

---

## [v1.1.1] - 2026-11-14
### Fixed
- **hub/remotion npm install 피어 의존성 충돌 해결**:
  - `hub/remotion/package.json`에 `overrides` 필드를 추가하고 `postprocessing`을 `6.36.4`로 고정하여, npm 7+ 환경에서 `three@0.166.1`과의 ERESOLVE 피어 충돌 원천 차단.
- **씬 파일 모듈 임포트 경로 및 TS 타입 검증 통과**:
  - `projects/bridge/`의 파일들에서 코어 셰이더 및 컴포넌트를 `@core/*` 경로로 정상 참조하도록 수정.
  - `hub/remotion/tsconfig.json` 및 `CartoonScene.tsx` 보강으로 `tsc --noEmit` 검증 0 에러 달성.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.1) 동기화 완료.

---

## [v1.1.0] - 2026-11-14
### Added & Refactored (하이브리드 Hub 아키텍처 구축)
- **단일 Remotion 호스트 구축 (`hub/remotion/`)**:
  - `node_modules`를 `hub/remotion/`에 단 1회만 설치하여 프로젝트별 1GB 이상의 디스크 중복 제거.
  - Three.js 코어 셰이더(`ink.ts`, `lensblur.ts`, `grade.ts`, `toon.ts`, `lights.ts`, `cardshade.ts`, `shade.ts`, `paint.ts`)를 `src/core/`로 분리.
  - 외부 프로젝트의 씬 코드를 마운트하는 범용 씬 컴포넌트 `CartoonScene.tsx` 및 `Root.tsx` 작성.
  - 중앙 스틸 프리뷰(`scripts/stills.mjs`) 및 렌더러(`scripts/render.mjs`) 제공.
- **중앙 오디오 믹서 구축 (`hub/audio/`)**:
  - `cartoon_audio/` 모듈(DSP, Instruments, SFX, March Score)을 단일 공통 라이브러리화.
  - `python hub/audio/mix.py --project projects/<name>` 한 줄로 해당 프로젝트의 `timeline.py`를 로드하고 BGM Ducking과 리미터를 적용한 `mix.wav`를 생성하도록 개편.
- **프로젝트 디렉토리 경량화 (`projects/bridge/`)**:
  - `node_modules` 없이 순수 씬 연출(`story.ts`, `build.ts`, `cast.ts`, `world.ts`)과 `timeline.py`만 보관하도록 구조 개선 (수백 KB 수준으로 경량화).
- **Skill 가이드 개편 (`SKILL.md`)**:
  - 새 쇼츠 제작 시 `node_modules` 재설치 없이 중앙 `hub/`를 참조하도록 지시문 전면 업데이트.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.0) 동기화 완료.

---

## [v1.0.0] - 2026-11-14
### Initial Release
- **The Bridge That Fell for a Song (오리지널 릴리스)**:
  - Claude Code용 Agent Skill(`SKILL.md`) 기반의 애니메이션 쇼츠 제작 파이프라인.
  - Three.js + Remotion 기반 2D-in-3D 툰 렌더링, 잉크 아웃라인, 렌즈 블러, 그레이딩 셰이더.
  - Python 기반 DSP 및 군악대 마치 스코어 합성 엔진.
