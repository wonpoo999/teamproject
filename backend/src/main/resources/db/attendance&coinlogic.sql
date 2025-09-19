-- =========================================================
-- attendance_and_customers_patch.sql  (FINAL)
-- 1) CUSTOMERS.created_at 추가 + 백필
-- 2) ATTENDANCE_LOG 생성(복합 PK) + 백필
-- 3) 편의를 위한 뷰(v_user_first_login)
-- =========================================================

-- ----------------------------
-- 안전 드랍 (있으면만)
-- ----------------------------
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW v_user_first_login';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE attendance_log CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

-- ----------------------------
-- CUSTOMERS.created_at 추가 (있으면 스킵)
-- ----------------------------
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE customers ADD (created_at TIMESTAMP DEFAULT SYSTIMESTAMP)';
EXCEPTION WHEN OTHERS THEN
  -- ORA-01430: column being added already exists in table
  IF SQLCODE != -1430 THEN RAISE; END IF;
END;
/

-- NOT NULL 보장
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE customers MODIFY (created_at NOT NULL)';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- 과거 활동에서 가입일(최초 활동일)로 백필
UPDATE customers c
SET created_at =
  COALESCE(
    (SELECT MIN(dt) FROM (
       SELECT MIN(r.record_date) dt FROM record r WHERE r.customer_id = c.idx
       UNION ALL
       SELECT MIN(b.record_date) dt FROM body   b WHERE b.customer_id = c.idx
       UNION ALL
       SELECT MIN(g.record_date) dt FROM goal   g WHERE g.customer_id = c.idx
     )),
    SYSTIMESTAMP
  )
WHERE c.created_at IS NULL;

-- ----------------------------
-- ATTENDANCE_LOG 생성 (복합 PK)
-- ----------------------------
CREATE TABLE attendance_log (
  customer_id  NUMBER NOT NULL,
  record_date  DATE   NOT NULL,
  CONSTRAINT pk_attendance_log PRIMARY KEY (customer_id, record_date),
  CONSTRAINT fk_attendance_customer
    FOREIGN KEY (customer_id) REFERENCES customers(idx) ON DELETE CASCADE
);

-- 고객별 조회 최적화 (단일컬럼 인덱스)
CREATE INDEX ix_attendance_log_cust ON attendance_log(customer_id);

-- ----------------------------
-- 과거 기록 → 출석 로그 백필
-- (하루 단위로 TRUNC하여 중복 없이 채움)
-- ----------------------------
MERGE INTO attendance_log t
USING (
  SELECT customer_id, TRUNC(record_date) AS d FROM record
  UNION
  SELECT customer_id, TRUNC(record_date) AS d FROM body
  UNION
  SELECT customer_id, TRUNC(record_date) AS d FROM goal
) src
ON (t.customer_id = src.customer_id AND t.record_date = src.d)
WHEN NOT MATCHED THEN
  INSERT (customer_id, record_date) VALUES (src.customer_id, src.d);

-- ----------------------------
-- "최초 로그인일" 뷰
--  (가입일과 출석 중 더 이른 날)
-- ----------------------------
CREATE OR REPLACE VIEW v_user_first_login AS
SELECT
  c.idx AS customer_id,
  TRUNC(
    LEAST(
      CAST(c.created_at AS DATE),
      COALESCE(
        (SELECT MIN(al.record_date) FROM attendance_log al WHERE al.customer_id = c.idx),
        CAST(c.created_at AS DATE)
      )
    )
  ) AS first_date
FROM customers c;

COMMIT;
