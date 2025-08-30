-- gender
ALTER TABLE customers DROP CONSTRAINT SYS_C007401;

ALTER TABLE customers
  ADD CONSTRAINT ck_customers_gender
  CHECK (gender IN ('M', 'F'));
