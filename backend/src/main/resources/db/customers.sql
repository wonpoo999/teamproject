-- gender 제약 조건 수정 및 추가

-- ✅ 각자 gender 제약 조건 gender CONSTRAINT_NAME SYS_XXXX 값 넣어서 DROP하기
ALTER TABLE customers DROP CONSTRAINT SYS_;

-- gender 컬럼의 값 : M or F 만 허용
ALTER TABLE customers
  ADD CONSTRAINT ck_customers_gender
  CHECK (gender IN ('M', 'F'));
