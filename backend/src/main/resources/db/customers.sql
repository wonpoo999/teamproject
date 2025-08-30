CREATE TABLE customers (
  id       VARCHAR2(100) PRIMARY KEY NOT NULL,
  password VARCHAR2(60)  NOT NULL,        -- BCrypt 해시 길이 60
  weight   NUMBER(4,1),
  height   NUMBER(4,1),                   -- 키도 소수 1자리 허용(177.2 등)
  gender   CHAR(1) CHECK (gender IN ('M','F')),
  age      NUMBER(3)
);


-- gender 
ALTER TABLE customers DROP CONSTRAINT SYS_C007401;

ALTER TABLE customers
  ADD CONSTRAINT ck_customers_gender
  CHECK (gender IN ('M','F','U'));