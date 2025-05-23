# Nexon Event Platform

- 이벤트/보상 관리 시스템 - NestJS Monorepo 기반 백엔드 과제


## 🧱 프로젝트 구조

```bash
apps/
  ├─ gateway/     # API 진입점, 인증, 권한 검사
  ├─ auth/        # 사용자, 역할, JWT 인증
  └─ event/      # 이벤트 및 보상 도메인

libs/
  └─ common/      # 공통 유틸, 예외, 데코레이터 등

.husky/           # 커밋 전 검사 Hook
```

- 추가적인 프로젝트 디렉토리 구조에 관한 설명은 [architecture.md](./architecture.md)를 참조해주세요.


## ⚙️ 품질 관리

| 도구         | 설명                                                              |
|--------------|-------------------------------------------------------------------|
| Husky        | `pre-commit`, `commit-msg` 훅에서 자동 검사 수행                  |
| lint-staged  | staged 파일에 한해 `eslint --fix`, `prettier --write` 실행        |
| commitlint   | 커밋 메시지 규칙 검증 (`feat:`, `fix:`, `chore:` 등)              |

→ `main` 브랜치에서는 커밋 전 자동 테스트도 수행됩니다.



## 📋 요구사항 분석

1. 현재 상황
	1. 이벤트를 자주하는데, 이벤트마다 아래 내용들을 수작업 > 비효율적
		1. 이벤트 마다 조건에 부합하는지 확인에 대한 어려움
		2. 보상 지급을 수작업해야한다.
2. 목표
	1. 조건 검증 로직과 보상 지급의 자동화.
		1. 유저는 조건 만족 후 직접 보상 요청
		2. 보상 지급은 운영자 검토 혹은 자동화
	2. 감사 담당자의 지급 내역 조회
	3. 위 상황에 맞는 인증과 권한 시스템 구축
3. 정리
	1. 조건 검증 및 보상 지급의 세부 요건에 해당하는 서버 구축
		1. 이벤트 생성 / 보상 정의 / 보상 요청 처리 / 지급 상태 저장
	2. 인가 처리를 위한 서버 구축
		1. 유저 정보 관리 / 로그인 / 역할 관리 / JWT 발급
	3. 게이트웨이 서버 구축
		1. 기본적인 인증 검사 후 각 책임 서버로 라우팅