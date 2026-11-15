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

## [v1.1.9] - 2026-11-15
### Improved & Enhanced (스리니바사 라마누잔: 원본 템플릿 비주얼 밀도 & 애니메이션 엔진 전면 이식)
- **절차적 3D 월드 아키텍처 및 HD 텍스처 복원 (`projects/ramanujan/build.ts`, `world.ts`)**:
  - `buildTown` 기반의 정밀한 조약돌 거리(`cobbleHD`), 고전 석조 대학 및 회랑 벽체(`stoneHD`), 지붕(`roofHD`), 채색 파사드(`facadeHD`), 나무/수풀 수관 셰이더 및 전등주를 전면 이식하여 비주얼 밀도 대폭 향상.
  - 전경의 인도 사원 만다라 제단과 깜빡이는 디야(Diya) 오일 램프 화염 연출 조화.
- **살아있는 캐릭터 애니메이션 엔진 및 접지 그림자 구현 (`projects/ramanujan/cast.ts`)**:
  - `bodyFront` 및 `bodySide` 기반으로 라마누잔의 0.8m 보폭 보행 주기(Walk Cycle), 상하 바운스, 팔 흔들림 모션 완벽 가동.
  - 0.5~2.3초 주기의 자연스러운 눈 깜빡임(`lidAt`)과 대사 상황에 맞춘 표정 변화(진지함, 미소, 경악 등) 탑재.
  - 발밑 접지 그림자 블랍(`fxContact`) 및 태양 방향 그림자 테일을 적용하여 캐릭터가 공중에 뜨지 않고 바닥에 견고하게 밀착되도록 개선.
- **수학적 리듬감의 사운드트랙 고도화 (`projects/ramanujan/audio/music.py`)**:
  - 120 bpm 쿼터노트 그리드 기반의 글로켄슈필/비브라폰 오스티나토 리듬 트랙 추가(수학적 정밀함과 시간의 흐름 표현).
  - 티베트 싱잉볼(432Hz) 및 사원 종소리, 우주 앰비언스 패드 믹싱으로 라우드니스 **-14.42 LUFS**, 피크 **-0.43 dBTP** 달성.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.9) 동기화 완료.

---

## [v1.1.8] - 2026-11-15
### Added & Completed (스리니바사 라마누잔: 신이 꿈속에 속삭인 방정식 - 원스톱 전자동 최종 완성)
- **실화 기반 미스터리 대본 및 15개 샷 스토리보드 구축 (`projects/ramanujan/SCRIPT.md`, `story.ts`)**:
  - 인도의 천재 수학자 라마누잔의 실화(나마기리 여신 계시, 케임브리지 하디 교수와의 서신, 3,900개 무증명 정리, 택시수 1729, 100년 후 블랙홀 엔트로피의 해법)를 67초(2,010프레임) 분량의 영화적 서사로 완성.
- **고음질 한국어 성우 내레이션 및 단어 단위 타임스탬프 동기화 (`projects/ramanujan/voice/`)**:
  - `ko-KR-InJoonNeural` 보이스 기반 다큐멘터리 톤의 48 kHz PCM 음성(`voice.wav`, 64.15초) 및 106개 단어 단위 정확한 타임스탬프(`words.json`) 추출.
- **맞춤형 앰비언트 오디오 사운드스케이프 및 DSP 믹싱 (`projects/ramanujan/audio/`)**:
  - 티베트/인도 싱잉볼(432Hz/864Hz 하모닉스), 청동 사원 종소리, 우주 앰비언스 드론, 블랙홀 서브베이스 럼블 합성.
  - `words.json` 발화 구간에 자동 BGM Ducking (-3 dB) 적용, 최종 믹스 **-15.13 LUFS**, 피크 **-0.44 dBTP** 달성 (`out/mix.wav`, `out/cues.md`).
- **인도 사원 성소 3D 씬 및 전용 캐릭터/이펙트 카드 (`projects/ramanujan/world.ts`, `cast.ts`)**:
  - 붉은 사암 석판 바닥, 로터스 만다라 제단, 8각 석조 기둥, 깜빡이는 디야(Diya) 오일 램프 및 천체 스피어 돔 구현.
  - 라마누잔, 나마기리 여신, 하디 교수, 부유하는 황금 수식 홀로그램, 블랙홀 시공간 소용돌이 카드 구현 (`NOINK` 레이어 적용).
- **Remotion 3D 렌더링 및 최종 Muxing 완료 (`projects/ramanujan/out/final.mp4`)**:
  - Remotion 동적 번들링 및 Angle GPU 가속 순차 렌더링 (`video_raw.mp4`, 2,010프레임).
  - FFmpeg 무손실 비디오-오디오 멀티플렉싱으로 최종 쇼츠 비디오(`final.mp4`) 완성.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.8) 동기화 완료.

---

## [v1.1.7] - 2026-11-15
### Added & Improved (스리니바사 라마누잔: 신이 꿈속에 속삭인 방정식 - 완전 독립 전용 씬 제작)
- **템플릿 재사용 탈피 및 라마누잔 전용 인도 사원 3D 월드 구축 (`projects/ramanujan/world.ts`)**:
  - 기존 유럽풍 다리 마을(`buildTown`)과 강물 메쉬를 전면 배제하고, 인도의 붉은 사암 석판 바닥과 기하학적 로터스 만다라, 8각 사암 석조 기둥 및 제단, 전통 오일 램프(Diya)로 구성된 신비로운 인도 사원 성소 무대 신규 설계.
  - 5컬러 스톱 천체 스피어 셰이더(우주 암흑 ➡️ 인디고 바이올렛 ➡️ 신성한 크림슨 ➡️ 황금빛 오커) 적용.
- **라마누잔 고유 캐릭터 및 수학적 비주얼 이펙트 (`projects/ramanujan/cast.ts`)**:
  - 스리니바사 라마누잔(인도 전통 사롱/숄, 붓과 석판 노트), 나마기리 여신(신성한 붉은 사리와 황금 후광), G.H. 하디 교수(에드워디언 영국 정장) 캐릭터 구현.
  - 여신 계시 수식 홀로그램, 수학 노트 #1 칠판, 1729 택시수, 100년 후 현대 블랙홀 엔트로피를 설명하는 시공간 왜곡(Black Hole Spacetime) 소용돌이 이펙트 구현.
- **전용 앰비언트 오디오 사운드스케이프 (`projects/ramanujan/audio/`)**:
  - 티베트/인도 싱잉볼 및 청동 사원 종소리(432Hz/864Hz 하모닉스)와 우주적 드론 앰비언스를 합성한 전용 사운드트랙 믹싱 완료 (`out/mix.wav`, -16.96 LUFS).
- **버전 동기화**: `hub/remotion/package.json` (v1.1.7) 동기화 완료.

---

## [v1.1.6] - 2026-11-14
### Added (신규 쇼츠 프로젝트: 니콜라 테슬라 - 무선 전력과 지진 기계)
- **신규 쇼츠 프로젝트 생성 (`projects/tesla/`)**:
  - 발명가 '니콜라 테슬라'의 1898년 맨해튼 지진 기계 실화와 1901년 전 지구 무선 전력 전송 타워(워든클리프)의 야망을 다룬 과학 미스터리 쇼츠 제작.
- **고음질 성우 내레이션 & 단어 단위 자막 동기화 (`projects/tesla/voice/`)**:
  - `ko-KR-InJoonNeural` 보이스 기반 다큐멘터리 톤의 한국어 음성(`voice.wav`, 48 kHz PCM, 81.5초) 생성.
  - VTT 기반 110개 단어 단위 정확한 타임스탬프(`words.json`) 추출 및 동기화.
- **오디오 DSP 및 타임라인 구축 (`projects/tesla/audio/`)**:
  - 15개 샷(총 2,445 프레임)과 연동된 `timeline.py` 구축.
  - 중앙 오디오 믹서(`hub/audio/mix.py`) 연동으로 통합 라우드니스 **-15.05 LUFS**, 피크 **-0.43 dBTP** 규격 완벽 적중.
- **테슬라 전용 Three.js 3D 씬 및 캐릭터 전면 제작 (`projects/tesla/cast.ts`, `story.ts`)**:
  - 니콜라 테슬라(Nikola Tesla), J.P. 모건(J.P. Morgan), 뉴욕 경찰 캐릭터 전용 제작.
  - 57미터 워든클리프 탑(Wardenclyffe Tower) 및 고전압 번개 아크 방전 이펙트 구현.
  - 포켓 사이즈 지진 진동기(Oscillator) 및 진동 충격파 펄스 이펙트 구현.
  - 15개 샷 전체에 걸친 글라이딩 카메라 및 지진 진동(Camera Shake) 연출.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.6) 동기화 완료.

---

## [v1.1.5] - 2026-11-14
### Added & Changed (스리니바사 라마누잔 프로젝트 및 Git 관리 최적화)
- **개별 프로젝트 디렉토리 Git 추적 제외 (`.gitignore`)**:
  - `projects/` 및 `remotion-tmp/`를 `.gitignore`에 등록하여 향후 생성되는 모든 쇼츠 하위 프로젝트와 렌더링 임시 번들이 Git 추적 및 업로드 대상에서 자동 제외되도록 조치.
- **신규 쇼츠 프로젝트 생성 (`projects/ramanujan/`)**:
  - 인도의 천재 수학자 '스리니바사 라마누잔'의 신비로운 실화(꿈속에서 나마기리 여신이 계시한 수천 개의 무증명 공식과 100년 후 블랙홀 이론의 토대)를 다룬 미스터리 다큐멘터리 쇼츠 제작.
- **고음질 성우 내레이션 & 단어 단위 자막 동기화 (`projects/ramanujan/voice/`)**:
  - `ko-KR-InJoonNeural` 보이스 기반 다큐멘터리 톤의 한국어 음성(`voice.wav`, 48 kHz PCM, 71.0초) 생성.
  - VTT 기반 102개 단어 단위 정확한 타임스탬프(`words.json`) 추출 및 동기화.
- **오디오 DSP 및 타임라인 구축 (`projects/ramanujan/audio/`)**:
  - 15개 샷(총 2,130 프레임)과 연동된 `timeline.py` 구축.
  - 중앙 오디오 믹서(`hub/audio/mix.py`) 연동으로 통합 라우드니스 **-15.47 LUFS**, 피크 **-0.43 dBTP** 규격 달성.
- **Three.js + Remotion 3D 렌더링 파이프라인 구동 (`projects/ramanujan/out/`)**:
  - Remotion 동적 번들링 및 Angle 가속 기반 순차 렌더링 파이프라인 실행.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.5) 동기화 완료.

---

## [v1.1.4] - 2026-11-14
### Added & Improved (세션 시작 가이드 및 생명주기 훅 보강)
- **Antigravity 세션 시작 훅 추가 (`.agents/hooks.json`, `.agents/session_start.py`)**:
  - `SessionStart` 생명주기 이벤트를 등록하여, 새 대화 세션 생성 시 시스템 메시지로 프로젝트 가이드 및 2가지 작업 모드를 AI 컨텍스트에 자동 주입(`injectSteps`).
- **Antigravity 전용 규칙 파일 동기화 (`GEMINI.md`)**:
  - Antigravity 네이티브 지원을 위해 `GEMINI.md`를 신규 생성하고 `AGENTS.md`와 동기화.
- **첫 턴 안내 지침 절대 강제화 (`AGENTS.md`, `GEMINI.md`)**:
  - `First Greeting Rule`을 최우선 순위로 격상하여 세션 시작 첫 턴에서 사용자의 질문 내용과 무관하게 2가지 모드(원스톱 전자동 완성 vs 대본 컨펌) 사용법을 반드시 선제 안내하도록 명시.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.4) 동기화 완료.

---

## [v1.1.3] - 2026-11-14
### Documentation & Agent Guidance
- **에이전트 첫 시작 사용 설명법 자동 안내 규칙 추가 (`AGENTS.md`)**:
  - 대화를 새로 시작하거나 새 작업을 진행할 때, 사용자가 요청 방식을 기억할 필요 없도록 2가지 작업 요청 방식(원스톱 완성 모드 vs 대본 컨펌 모드)을 첫 응답에 항상 먼저 안내하도록 필수 선행 지침(First Greeting Rule) 등록.
- **루트 `README.md` 사용 가이드 보강**:
  - 자연어 요청 방법 및 모드별 예시 대화 가이드를 상단에 배치.
- **버전 동기화**: `hub/remotion/package.json` (v1.1.3) 동기화 완료.

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
