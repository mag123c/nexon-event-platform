# 🔧 설계 구조 (Initial Architecture Draft)

서비스의 구성 요소를 구상할 때 요구사항에 따라 다음과 같은 구조로 시각화하면서 출발했습니다:

![Initial Architecture Diagram](./assets/architecture-initial.png)

> 각 서버의 책임을 분리하고 Gateway를 진입점으로 설정한 기본적인 MSA 형태입니다.



## 📁 프로젝트 디렉토리 구조

상세 디렉토리 구조는 다음과 같습니다.

---

### 1. Auth Server (`apps/auth`)

Auth Server는 사용자 계정 관리 및 인증 토큰 발급을 전담합니다.

*   주요 기능: 사용자 등록, 로그인, 역할 관리, JWT 발급 및 검증 (내부용)

```text
apps/
└── auth/
    ├── src/
    │   ├── application/                                   // 애플리케이션 서비스 및 유스케이스
    │   │   └── use-cases/                                 // 시스템의 주요 기능 단위 (예: 회원가입, 로그인)
    │   │       ├── login-user/                            // 로그인
    │   │       │   ├── login-user.usecase.ts              // 로그인 유즈케이스
    │   │       │   ├── login-user.usecase.spec.ts         // 유즈케이스 단위 테스트
    │   │       │   └── login-user.input.ts                // 유스케이스 내부 입력 인터페이스 정의
    │   │       │   └── login-user.output.ts               // 유스케이스 내부에서 나가는 인터페이스 정의
    │   │       └── register-user/                         // 회원 가입
    │   │           ├── register-user.usecase.ts 
    │   │           ├── register-user.usecase.spec.ts
    │   │           └── register-user.input.ts                     
    │   │   
    │   │   
    │   ├── domain/                                        // 핵심 비즈니스 로직 및 도메인 모델
    │   │   ├── entities/                                  // 도메인 엔티티 (내부 생략)
    │   │   ├── errors/                                    // 해당 도메인의 에러 정의 (내부 생략)
    │   │   ├── ports/                                     // 도메인 내부 인터페이스 모음 (DIP)
    │   │   │   └── user.repository.ts                     // 영속 계층 접근 인터페이스
    │   │   │   └── hasing.port.ts                         // 암호화를 위한 인터페이스
    │   │   │   └── token-generator.port.ts                // 토큰 생성 인터페이스
    │   │   └── value-objects/                             // 도메인 내부 순수 값 객체 (내부 생략)
    │   │ 
    │   │   
    │   ├── infrastructure/                                // 외부 시스템 연동 및 실제 구현체    
    │   │   ├── hashing/                                   // 비밀번호 해싱
    │   │   │   └── argon2.service.ts
    │   │   ├── jwt/                                       // JWT (nestjs/jwt)
    │   │   │   └── jwt.service.ts
    │   │   └── persistence/                               // DB (영속 계층)
    │   │       └── user-mongo.repository.ts               // MongoDB 기반 User 리포지토리 구현체 (다른 영속 계층이 있다면 디렉토리 분류)
    │   │ 
    │   │ 
    │   ├── presentation/                                  // 외부 연동 인터페이스 (API 컨트롤러, DTO 등)
    │   │   ├── controllers/                               // HTTP 요청 처리 컨트롤러 (내부 생략)
    │   │   └── dtos/                                      // DTO (내부/설명 생략)
    │   │       ├── request/
    │   │       └── response/
    │   │       
    │   │       
    │   │── user/                                          // 사용자 관리
    │   │   ├── application/
    │   │   │   └── use-cases
    │   │   │       └── get-user                           // 유저 정보
    │   │   ├── domain/
    │   │   │   ├── entities/                            
    │   │   │   ├── errors/                                  
    │   │   │   ├── ports/                                   
    │   │   │   └── ...
    │   │   ├── infrastructure/
    │   │   │   └── persistence/                       
    │   │   ├── presentation/
    │   │   │   ├── controllers/                       
    │   │   │   └── dtos/                              
    │   │   └── user.module.ts                         
    │   │ 
    │   │     
    ├── test/
    │   └── fixture/                                       // 유저 생성을 위한 Fixture
    │   └── auth.e2e-spec.ts
    │   │ 
    │   │ 
    │   ├── auth.module.ts 
    │   └── main.ts    
    │   
    └── Dockerfile
```

---

### 2. Gateway Server (`apps/gateway`)

API Gateway는 모든 클라이언트 요청의 단일 진입점(Single Entry Point) 역할을 수행합니다. 주요 책임은 다음과 같습니다:

*   인증 및 권한 부여: JWT 토큰 검증 및 역할 기반 접근 제어
*   요청 라우팅: 수신된 요청을 적절한 내부 마이크로서비스(`Auth`, `Events`)로 전달


```text
apps/
└── gateway/
    ├── src/
    │   ├── auth                                        // 게이트웨이 인증 관련 (내부/설명 생략)
    │   |   ├── decorators
    │   |   ├── guards                  
    │   |   └── strategy                   
    │   |
    │   |
    │   ├── config/                                     // 게이트웨이 설정
    │   |   └── gateway-proxy.config.ts                 // 프록시 대상 경로 설정
    │   │
    │   │
    │   ├── proxy/                                      // 백엔드 서비스로의 요청 프록시 및 라우팅
    │   │   ├── controllers/                            // 서비스 그룹별 프록시 컨트롤러 (내부 생략)
    │   │   └── services/                               // 실제 HTTP 요청 포워딩 및 응답 처리 로직 (내부 생략)
    │   │   └── proxy.module.ts
    │   │ 
    │   │ 
    │   ├── shared/                                    // 게이트웨이 전역에 사용되는 코드
    │   |   ├── constnats/                 
    │   |   |   └── headers.constants.ts               // 프록시로 전해질 커스텀 헤더 상수
    │   |   └── errors
    │   | 
    │   | 
    │   ├── app.module.ts
    │   └── main.ts 
    │
    │
    ├── test/
    │   └── gateway.e2e-spec.ts
    │ 
    └── Dockerfile
```


---

### 3. Event Server (`apps/event`)

Event Server는 이벤트 생성/관리, 보상 정의, 사용자 보상 요청 처리 및 내역 관리를 담당합니다. 초기에는 단일 모듈로 구성되었으나, 기능 확장과 책임 분리를 위해 다음과 같이 하위 모듈로 재구성되었습니다.

*   **`EventCoreModule`**: 이벤트 자체의 CRUD, 조건 정의 및 검증, 외부 서비스(Auth) 연동을 통한 유저 활동 데이터 조회 등 이벤트의 핵심 기능을 담당.
*   **`RewardModule`**: 이벤트에 연결되는 보상의 CRUD, 보상 상세 정보 유효성 검증, 보상 수량 관리 등을 담당.
*   **`EventClaimModule`**: 사용자의 이벤트 보상 요청 처리, 조건 매칭, 트랜잭셔널한 보상 지급, 요청 내역 관리 및 조회를 담당.

```text
apps/
└── event/
    ├── src/
    │   ├── config/                                // 서비스 URL, DB URI 등 설정
    │   │   └── services.config.ts                 // 외부 서비스와의 설정
    │   │
    │   ├── event-core/                            // 이벤트 핵심 기능 모듈
    │   │   ├── application/
    │   │   │   ├── config/                        // 이벤트 조건 관련 설정 (지원하는 이벤트에 대한 설정)
    │   │   │   ├── ports/                         
    │   │   │   ├── services/                      
    │   │   │   └── use-cases/                     
    │   │   ├── domain/
    │   │   │   ├── entities/                      // Event 엔티티
    │   │   │   ├── embedded/                      // EventCondition 스키마 (Event 엔티티 내 사용)
    │   │   │   ├── errors/                        
    │   │   │   ├── factories/                     
    │   │   │   ├── ports/                       
    │   │   │   └── value-objects/                 // 값 자체(이벤트 상태, 이벤트 조건의 operator, 이벤트 조건의 카테고리)
    │   │   ├── infrastructure/
    │   │   │   ├── adapters/                      // UserActivityHttpFetcher (Auth 서버 연동)
    │   │   │   ├── factories/                    
    │   │   │   └── persistence/                  
    │   │   ├── presentation/
    │   │   │   ├── controllers/                  
    │   │   │   └── dtos/                         
    │   │   └── event-core.module.ts
    │   │
    │   ├── reward/                                // 보상 관리 모듈
    │   │   ├── application/
    │   │   │   ├── services/                 
    │   │   │   └── use-cases/                     
    │   │   ├── domain/
    │   │   │   ├── entities/                 
    │   │   │   ├── errors/                   
    │   │   │   ├── factories/                
    │   │   │   ├── ports/                    
    │   │   │   └── value-objects/            
    │   │   ├── infrastructure/
    │   │   │   ├── factories/                    
    │   │   │   └── persistence/                  
    │   │   ├── presentation/
    │   │   │   ├── controllers/                  
    │   │   │   └── dtos/                         
    │   │   └── reward.module.ts
    │   │
    │   ├── event-claim/                           // 이벤트 클레임(보상 신청) 모듈
    │   │   ├── application/
    │   │   │   └── use-cases/                     // ClaimRewardUseCase, ListMyEventClaimsUseCase, ListAllEventClaimsUseCase
    │   │   ├── domain/
    │   │   │   ├── entities/         
    │   │   │   ├── embedded/        
    │   │   │   ├── errors/          
    │   │   │   ├── factories/       
    │   │   │   ├── interfaces/      
    │   │   │   └── ports/           
    │   │   ├── infrastructure/
    │   │   │   ├── factories/       
    │   │   │   └── persistence/     
    │   │   ├── presentation/
    │   │   │   ├── controllers/     
    │   │   │   └── dtos/            
    │   │   └── event-claim.module.ts
    │   │
    │   ├── event-app.module.ts                          // Event 서버의 최상위 모듈 (위 기능 모듈들을 imports)
    │   └── main.ts
    │
    ├── test/
    │   ├── fixture/                               // 테스트용 Fixture 데이터 생성 로직
    │   └── event-claim.e2e-spec.ts                // 이벤트 보상 신청 e2e (유저 생성 ~ 보상 신청 후 조회까지의 플로우 e2e)
    │  
    └── Dockerfile
```

---
