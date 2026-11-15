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

- [ ] (렌더 파이프라인) Kenney CC0 에셋 자동 다운로더 또는 `runtime/remotion/public/` 동기화 헬퍼 추가
- [ ] (사운드) 다국어 TTS/단어 타임스탬프(`words.json`) 자동 정렬 도우미 연동

---

## [v1.0.4] - 2026-11-15
### Fixed (2K 렌더러 정수 스케일링 패치 및 스킬 산출물 히스토리 분리)
- **`render.mjs` 2K 정수 스케일링 버그 수정**:
  - `stitchFramesToVideo`의 2K 렌더링 시 부동소수점 오차(`2559.936`)를 방지하기 위해 `4 / 3` 정수 비율을 적용하여 정확한 1440x2560 해상도로 출력되도록 수정했습니다.
- **버전 관리 규칙 정립 (`AGENTS.md`)**:
  - 스킬 실행으로 생성되는 개별 쇼츠 산출물(`shorts/<name>/`)은 히스토리 기록에서 제외하고, 공통 런타임/엔진/스크립트/설정 변경 시에만 버전을 관리하도록 규칙을 확립했습니다.
- **버전 동기화**:
  - `runtime/remotion/package.json` 버전을 `v1.0.4`로 유지/동기화했습니다.

---

## [v1.0.3] - 2026-11-15
### Changed & Fixed (.gitignore 스킬 런타임 생성 폴더 및 임시 산출물 제외 강화)
- **`shorts/` 생성 디렉터리 Git 추적 제외**:
  - 스킬(`cartoon-3d-short-shared`) 실행 및 `init_short.py` 시 자동 생성되는 `shorts/` 폴더 및 개별 쇼츠 하위 프로젝트 전체를 `.gitignore`에 등록하여 Git 업로드를 원천 차단했습니다.
- **임시 번들 및 렌더 산출물 제외 보강**:
  - Webpack 임시 번들(`remotion-webpack-bundle-*`), 전역 비디오 산출물(`*.mp4`, `*.webm`), 파이프라인 캐시(`**/_cache/`), Python 바이트코드(`*.pyo`) 및 OS 아티팩트 패턴을 `.gitignore`에 추가했습니다.
- **버전 동기화**:
  - `runtime/remotion/package.json` 버전을 `v1.0.3`으로 동기화했습니다.

---

## [v1.0.2] - 2026-11-15
### Added & Updated (버전 관리 및 Git 커밋 규칙 도입)
- **`CHANGELOG.md` 및 Semantic Versioning 체계 도입**:
  - 모든 수정 내역을 `[vMajor.Minor.Patch] - YYYY-MM-DD` 형식으로 기록하고 `runtime/remotion/package.json` 버전과 동기화하도록 규칙을 수립했습니다.
- **`AGENTS.md` 규칙 확장**:
  - 작업 전 `CHANGELOG.md` 및 백로그 확인 의무, 한국어 응답, Three.js/Audio 품질 기준, AI의 Git Write 명령 실행 금지 및 응답 최하단 커밋 명령어 필수 제공 규칙을 반영했습니다.

---

## [v1.0.1] - 2026-11-15
### Added & Changed (공유 Skill 런타임 아키텍처 및 전역 등록)
- **공유 Remotion / Three.js 런타임 구축 (`runtime/remotion/`)**:
  - `node_modules`를 `runtime/remotion/`에 1회만 설치하고, 8개 공통 셰이더/툰 모듈(`@core/*`) 및 동적 컴포지션(`ShortComposition.tsx`)을 중앙화했습니다.
- **공유 오디오 엔진 및 경량 스캐폴딩 (`runtime/audio/`, `runtime/scripts/`)**:
  - `mix.py --project shorts/<name>`, `init_short.py`, `stills.mjs`, `render.mjs`를 구현하고 `remotion-webpack-bundle-*` 임시 폴더 자동 정리를 적용했습니다.
- **Skill 이름 변경 및 등록 (`cartoon-3d-short-shared`)**:
  - `.agents/skills/cartoon-3d-short-shared/SKILL.md` 및 전역 정션(`~/.gemini/antigravity-cli/skills/cartoon-3d-short-shared`)을 연결했습니다.

---

## [v1.0.0] - 2026-11-14
### Initial Release
- **The Bridge That Fell for a Song (`main` 오리지널 스킬 릴리스)**:
  - Three.js + Remotion 기반 2D-in-3D 툰 렌더링, 잉크 아웃라인, 렌즈 블러, 그레이딩 셰이더 및 Python DSP 사운드 합성 파이프라인.
