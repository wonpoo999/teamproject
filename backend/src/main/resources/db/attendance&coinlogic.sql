-- 특정 이메일의 첫 로그인일(= 최소 record_date)
SELECT c.id, MIN(r.record_date) AS first_login
FROM customers c
LEFT JOIN RECORD r ON r.customer_id = c.idx
WHERE c.id = 'user@example.com'
GROUP BY c.id;
