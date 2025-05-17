export enum EventConditionOperator {
  EQUALS = 'EQUALS', // 같다
  NOT_EQUALS = 'NOT_EQUALS', // 같지 않다
  GREATER_THAN = 'GREATER_THAN', // 크다
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL', // 크거나 같다
  LESS_THAN = 'LESS_THAN', // 작다
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL', // 작거나 같다
  // IN = 'IN', // 배열에 포함 (예: 특정 아이템 구매 여부)
  // NOT_IN = 'NOT_IN', // 배열에 미포함 (예: 특정 아이템 미구매 여부)
  // BETWEEN = 'BETWEEN', // 두 값 사이 (value가 [min, max] 형태의 배열)
}
