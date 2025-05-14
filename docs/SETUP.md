# Nexon Event Platform

> 이벤트/보상 관리 시스템 - NestJS Monorepo 기반 백엔드 과제

---

## 🧱 프로젝트 구조

```bash
apps/
  ├─ gateway/     # API 진입점, 인증, 권한 검사
  ├─ auth/        # 사용자, 역할, JWT 인증
  └─ events/      # 이벤트 및 보상 도메인

libs/
  └─ common/      # 공통 유틸, 예외, 데코레이터 등

.husky/           # 커밋 전 검사 Hook
```

--- 

## ⚙️ 품질 관리

| 도구         | 설명                                                              |
|--------------|-------------------------------------------------------------------|
| Husky        | `pre-commit`, `commit-msg` 훅에서 자동 검사 수행                  |
| lint-staged  | staged 파일에 한해 `eslint --fix`, `prettier --write` 실행        |
| commitlint   | 커밋 메시지 규칙 검증 (`feat:`, `fix:`, `chore:` 등)              |

→ `main` 브랜치에서는 커밋 전 자동 테스트도 수행됩니다.