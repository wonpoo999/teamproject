CREATE TABLE goal (
    id VARCHAR2(100) PRIMARY KEY NOT NULL,
    target_weight NUMBER(4, 1) NOT NULL,
    target_calories NUMBER(5) NOT NULL,
    FOREIGN KEY (id) REFERENCES customers(id) ON DELETE CASCADE
);

SELECT * FROM goal;

-- GOAL 테이블에 record_date 컬럼 추가
ALTER TABLE goal ADD record_date DATE;

-- null 값이 들어가지 않도록 제약 조건 추가
ALTER TABLE goal MODIFY record_date DATE NOT NULL;