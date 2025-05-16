# Nexon Event Platform - MongoDB Collection Structure

#### 🗂 초기 ERD 설계 (Initial Entity Relationship Diagram)

![ERD Diagram](./assets/erd-initial.png)

> 이벤트/보상 관리 시스템의 초안 ERD입니다.  
> MongoDB 기반 구조지만 정규화된 형태로 설계해 확장성과 명확성을 우선했습니다.
> 설계 및 렌더링은 [dbdiagram.io](https://dbdiagram.io) 를 사용했습니다.

---

이 문서는 위 최초 ERD 설계를 기반으로 MongoDB 컬렉션들의 구조를 정의합니다.
각 컬렉션은 특정 도메인의 데이터를 관리하며, 필요에 따라 데이터를 임베딩하거나 다른 컬렉션을 참조합니다.

## 1. `users` (Auth Server)

사용자 계정 정보, 역할 및 활동 데이터를 관리합니다.

| 필드명           | 타입          | 설명                                                                        | 비고 (제약조건 등)             |
|----------------|--------------|----------------------------------------------------------------------------|----------------------------|
| `_id`          | `ObjectId`   | MongoDB 기본 PK                                                             | 자동 생성                    |
| `email`        | `String`     | 이메일 주소 (로그인 ID로 사용)                                                   | Unique                     |
| `password`     | `String`     | 비밀번호                                                                     |                            |
| `roles`        | `[String]`   | 사용자 역할                                                                  |                            |
| `refreshToken` | `String`     | 리프레시 토큰                                                                 |                           |
| `activityData` | `Object`     | 이벤트 조건 검증에 필요한 사용자 활동 데이터 (Auth 서버가 관리하고 API로 제공)             | 구조는 아래 예시 참조          |
| `createdAt`    | `Date`       | 생성 일시                                                                    |                           |
| `updatedAt`    | `Date`       | 마지막 수정 일시                                                               |                           |

**`activityData` 객체 구조 예시:**
```json
{
  "loginCount": 10,
  "lastLoginAt": "2024-07-10T14:30:00Z",
  "invitedFriendsCount": 3
}
```

## 2. `events` 컬렉션 (Event Server)

이벤트의 기본 정보, 기간, 상태 및 달성 조건을 정의합니다.

| 필드명                   | 타입         | 설명                                                                           | 비고 (제약조건 등)                |
|--------------------------|--------------|--------------------------------------------------------------------------------|-----------------------------------|
| `_id`                    | `ObjectId`   | PK                                                                             | 자동 생성                         |
| `name`                   | `String`     | 이벤트 명칭                                                                      |                                   |
| `description`            | `String`     | 이벤트 상세 설명                                                                   | 선택적                           |
| `startDate`              | `Date`       | 이벤트 시작 일시                                                                   |                                   |
| `endDate`                | `Date`       | 이벤트 종료 일시                                                                   |                                   |
| `status`                 | `String`     | 이벤트 상태 (`SCHEDULED`, `ACTIVE`, `INACTIVE`, `ENDED`)                         |                                   |
| `conditions`             | `[Object]`   | 이벤트 달성 조건 객체 배열. 각 객체는 아래 `EventCondition` 구조 참조.               | 이벤트 생성/수정 시 함께 정의      |
| `requiresManualApproval` | `Boolean`    | 운영자 수동 승인 필요 여부                                                         | 기본값: `false`                   |
| `createdBy`              | `ObjectId`   | 생성자 (`users._id` 참조)                                                        |                                   |
| `createdAt`              | `Date`       | 생성 일시                                                                        |                                   |
| `updatedAt`              | `Date`       | 마지막 수정 일시                                                                 |                                   |
| `updatedBy`              | `ObjectId`   | 마지막 수정자 (`users._id` 참조)                                                   |                                   |

### `EventCondition` (임베디드 객체) 구조

`events` 컬렉션의 `conditions` 배열 내 각 객체의 구조입니다.

| 필드명          | 타입     | 설명                                                                 | 비고 (제약조건 등)         |
|-----------------|----------|----------------------------------------------------------------------|----------------------------|
| `category`      | `String`   | 조건 대분류 (예: `USER_ACTIVITY`, `PURCHASE_HISTORY`)                    |                            |
| `type`          | `String`   | 조건 상세 타입 (예: `CONSECUTIVE_LOGIN_DAYS`)                            |                            |
| `operator`      | `String`   | 검증 연산자                                                                 |                            |
| `value`         | `Mixed`    | 조건 목표 값                                                                |                            |
| `unit`          | `String`   | 값의 단위 (예: `days`, `count`)                                          |                            |
| `description`   | `String`   | 조건에 대한 상세 설명                                                      |                            |

## 3. `rewards` 컬렉션 (Event Server)

이벤트에 연결된 보상 정보를 정의합니다. 하나의 이벤트는 여러 종류의 보상을 가질 수 있습니다.

| 필드명                       | 타입         | 설명                                                                           | 비고 (제약조건 등)         |
|------------------------------|--------------|--------------------------------------------------------------------------------|----------------------------|
| `_id`                        | `ObjectId`   | PK                                                                             | 자동 생성                 |
| `eventId`                    | `ObjectId`   | 연결된 이벤트 ID (`events._id` 참조)                                             |                            |
| `name`                       | `String`     | 보상 명칭                                                                        |                            |
| `description`                | `String`     | 보상 상세 설명                                                                     |                            |
| `type`                       | `String`     | 보상 종류 (`POINT`, `ITEM`, `COUPON` 등)                                         |                            |
| `details`                    | `Mixed`      | 보상 타입에 따른 고유 상세 정보 객체 (구조는 `type`에 따라 유동적)                   | 예시는 아래 참조            |
| `quantity`                   | `Number`     | 총 보상 수량 (`null` 은 무제한)                                                  |                            |
| `remainingQuantity`          | `Number`     | 남은 보상 수량                                                                   |                            |
| `createdBy`                  | `ObjectId`   | 보상 생성자 (`users._id` 참조)                                                     |                            |
| `createdAt`                  | `Date`       | 생성 일시                                                                        |                            |
| `updatedAt`                  | `Date`       | 마지막 수정 일시                                                                   |                            |
| `updatedBy`                  | `ObjectId`   | 마지막 수정자 (`users._id` 참조)                                                   |                            |

**`details` 객체 구조 예시 (type에 따라 다름):**
*   `type: "POINT"` → `details: { "amount": 1000 }`
*   `type: "ITEM"` → `details: { "itemId": "SWORD_001", "itemName": "초보자의 검", "quantity": 1 }`
*   `type: "COUPON"` → `details: { "couponCode": "WELCOME24", "discountValue": 5000, "discountUnit": "KRW" }`

## 4. `event_claims` 컬렉션 (Event Server)

사용자의 이벤트 보상 요청 및 그 처리 내역을 기록합니다.

| 필드명                   | 타입         | 설명                                                                                | 비고 (제약조건 등)         |
|--------------------------|--------------|-------------------------------------------------------------------------------------|----------------------------|
| `_id`                    | `ObjectId`   | PK                                                                                  | 자동 생성                 |
| `userId`                 | `ObjectId`   | 요청 사용자 ID (`users._id` 참조)                                                     |                            |
| `eventId`                | `ObjectId`   | 요청 이벤트 ID (`events._id` 참조)                                                    |                            |
| `grantedReward`          | `Object`     | 실제로 지급 확정된 보상 정보 (스냅샷). 아래 `GrantedReward` 구조 참조.                  |                            |
| `status`                 | `String`     | 요청 처리 상태 (`REQUESTED`, `SUCCESS`, `FAILED_CONDITIONS_NOT_MET` 등)             |                            |
| `conditionCheckDetails`  | `[Object]`   | 조건 검증 결과 상세 객체 배열. 각 객체는 `ConditionCheckResult` 구조 참조.           | 디버깅/감사용               |
| `failureReason`          | `String`     | 지급 실패 시 상세 사유                                                                  |                            |
| `requestedAt`            | `Date`       | 사용자 요청 시각                                                                        |                            |
| `processedAt`            | `Date`       | (선택적) 최종 처리(성공/실패) 완료 시각                                                  |                            |
| `createdAt`              | `Date`       | 생성 일시                                                                              |                            |
| `updatedAt`              | `Date`       | 마지막 수정 일시 (주로 `status` 변경 시)                                               |                            |

### `GrantedReward` (임베디드 객체) 구조

`event_claims` 컬렉션의 `grantedReward` 객체 구조입니다. 지급 시점의 보상 정보를 저장합니다.

| 필드명      | 타입     | 설명                               |
|-------------|----------|------------------------------------|
| `rewardId`  | `ObjectId` | 지급된 보상의 `rewards._id` 참조     |
| `name`      | `String`   | 지급 시점의 보상 명칭                |
| `type`      | `String`   | 지급 시점의 보상 타입                |
| `details`   | `Mixed`    | 지급 시점의 보상 상세 정보 객체       |

### `ConditionCheckResult` (임베디드 객체) 구조

`event_claims` 컬렉션의 `conditionCheckDetails` 배열 내 각 객체의 구조입니다.

| 필드명          | 타입     | 설명                               |
|-----------------|----------|------------------------------------|
| `conditionType` | `String`   | 검증된 조건의 타입                   |
| `targetValue`   | `Mixed`    | 조건의 목표 값                      |
| `actualValue`   | `Mixed`    | 검증 시점의 사용자 실제 값            |
| `isMet`         | `Boolean`  | 조건 충족 여부                      |
| `checkedAt`     | `Date`     | 해당 조건 검증 시각                  |

---
