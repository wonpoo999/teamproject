// backend/src/main/java/com/example/health_care/controller/AttendanceController.java — 최종본
package com.example.health_care.controller;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final JdbcTemplate jdbc;

    public AttendanceController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private Long findCustomerIdByEmail(String email) {
        if (email == null || email.isBlank()) return null;
        try {
            return jdbc.queryForObject(
                    "SELECT idx FROM customers WHERE id = ?",
                    Long.class, email
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    /** 가입 시점(첫 body 기록일) */
    private LocalDate loadAccountCreated(LocalDate fallbackToday, Long customerId) {
        if (customerId == null) return fallbackToday;
        Date d = jdbc.queryForObject(
                "SELECT MIN(record_date) FROM body WHERE customer_id = ?",
                Date.class, customerId
        );
        return d != null ? d.toLocalDate() : fallbackToday;
    }

    private Set<LocalDate> loadLoginDates(Long customerId) {
        if (customerId == null) return Collections.emptySet();
        List<Date> rows = jdbc.query(
                "SELECT record_date FROM attendance_log WHERE customer_id = ?",
                (rs, i) -> rs.getDate(1),
                customerId
        );
        return rows.stream().map(Date::toLocalDate).collect(Collectors.toCollection(TreeSet::new));
    }

    private int computeCalendarStreak(Set<LocalDate> loginDays, LocalDate today) {
        if (loginDays.isEmpty()) return 0;
        int streak = 0;
        LocalDate d = today;
        if (!loginDays.contains(d)) d = d.minusDays(1);
        while (loginDays.contains(d)) {
            streak++;
            d = d.minusDays(1);
        }
        return streak;
    }

    private boolean isMonthPerfect(Set<LocalDate> loginDays, YearMonth ym) {
        LocalDate d = ym.atDay(1);
        int len = ym.lengthOfMonth();
        for (int i = 0; i < len; i++) {
            if (!loginDays.contains(d)) return false;
            d = d.plusDays(1);
        }
        return true;
    }

    /** 최초 로그인일 (출석 없으면 가입일로 fallback) */
    @GetMapping("/first-login")
    public Map<String, Object> firstLogin(@RequestParam(name = "email", required = false) String email) {
        final LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        final Long customerId = findCustomerIdByEmail(email);
        LocalDate first = today;

        if (customerId != null) {
            Date d = jdbc.queryForObject(
                    "SELECT MIN(record_date) FROM attendance_log WHERE customer_id = ?",
                    Date.class, customerId
            );
            if (d != null) first = d.toLocalDate();
            else first = loadAccountCreated(today, customerId);
        }
        return Map.of("firstDate", first.toString());
    }

    /** 상태 집계(달력일 기준, 출석 없으면 가입일로 first/last 설정) */
    @GetMapping("/status")
    public Map<String, Object> status(@RequestParam(name = "email", required = false) String email) {
        final Long customerId = findCustomerIdByEmail(email);
        final LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        final Set<LocalDate> loginDays = loadLoginDates(customerId);

        final LocalDate fallbackCreated = loadAccountCreated(today, customerId);
        final LocalDate firstDate = loginDays.isEmpty() ? fallbackCreated : loginDays.iterator().next();
        final LocalDate lastDate  = loginDays.isEmpty() ? fallbackCreated : loginDays.stream().reduce((a,b)->b).orElse(fallbackCreated);

        final int totalDays = loginDays.size();
        final int currentStreak = computeCalendarStreak(loginDays, today);

        final YearMonth ymNow = YearMonth.from(today);
        final int monthDays = (int) loginDays.stream().filter(d -> YearMonth.from(d).equals(ymNow)).count();

        int monthStreak = 0;
        if (!loginDays.isEmpty()) {
            LocalDate end = loginDays.contains(today) ? today : today.minusDays(1);
            LocalDate d = ymNow.atDay(1);
            while (!d.isAfter(end)) {
                if (!loginDays.contains(d)) break;
                monthStreak++;
                d = d.plusDays(1);
            }
        }

        int coins = (totalDays / 2) + ((totalDays / 30) * 30);
        YearMonth iter = YearMonth.from(firstDate);
        while (!iter.isAfter(ymNow)) {
            if (isMonthPerfect(loginDays, iter)) coins += 15;
            iter = iter.plusMonths(1);
        }

        int todayCoins = 0;
        if (loginDays.contains(today)) {
            if (totalDays % 2 == 0) todayCoins += 1;
            if (totalDays % 30 == 0) todayCoins += 30;
            if (isMonthPerfect(loginDays, ymNow) && today.getDayOfMonth() == ymNow.lengthOfMonth()) {
                todayCoins += 15;
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("firstDate", firstDate.toString());
        out.put("lastDate",  lastDate.toString());
        out.put("totalDays", totalDays);
        out.put("currentStreak", currentStreak);
        out.put("monthKey", ymNow.toString());
        out.put("monthStreak", monthStreak);
        out.put("monthDays", monthDays);
        out.put("coins", coins);
        out.put("todayCoins", todayCoins);
        return out;
    }

    /** 월별 로그인 이력(yyyy-MM → dates:[yyyy-mm-dd]) */
    @GetMapping("/history")
    public Map<String, Object> history(@RequestParam("month") String month,
                                       @RequestParam(name = "email", required = false) String email) {
        final Long customerId = findCustomerIdByEmail(email);
        if (customerId == null) return Map.of("dates", List.of());
        YearMonth ym = YearMonth.parse(month);
        LocalDate s = ym.atDay(1);
        LocalDate e = ym.atEndOfMonth();
        List<Date> rows = jdbc.query(
                "SELECT record_date FROM attendance_log WHERE customer_id = ? AND record_date BETWEEN ? AND ? ORDER BY record_date",
                (rs, i) -> rs.getDate(1),
                customerId, Date.valueOf(s), Date.valueOf(e)
        );
        List<String> out = rows.stream().map(d -> d.toLocalDate().toString()).collect(Collectors.toList());
        return Map.of("dates", out);
    }

    /** (프론트 호환용) yyyy-MM → days:[1,5,9,...] */
    @GetMapping("/calendar")
    public Map<String, Object> calendar(@RequestParam("month") String month,
                                        @RequestParam(name = "email", required = false) String email) {
        Map<String, Object> h = history(month, email);
        @SuppressWarnings("unchecked")
        List<String> dates = (List<String>) h.getOrDefault("dates", List.of());
        List<Integer> days = dates.stream()
                .map(s -> Integer.parseInt(s.substring(8,10)))
                .sorted()
                .collect(Collectors.toList());
        return Map.of("days", days);
    }

    /** 오늘(또는 지정일) 체크인: upsert + 상태 반환 (KST) */
    @PostMapping("/checkin")
    public Map<String, Object> checkin(@RequestParam(name = "email", required = false) String email,
                                       @RequestBody(required = false) Map<String,Object> body) {
        final Long customerId = findCustomerIdByEmail(
                email != null ? email : body != null ? String.valueOf(body.getOrDefault("email","")) : null
        );
        if (customerId == null) return Map.of("message", "unknown_user");

        final ZoneId KST = ZoneId.of("Asia/Seoul");
        String dateStr = body != null ? String.valueOf(body.getOrDefault("date","")) : "";
        LocalDate day = (dateStr != null && dateStr.matches("\\d{4}-\\d{2}-\\d{2}"))
                ? LocalDate.parse(dateStr)
                : LocalDate.now(KST);

        jdbc.update(
            "MERGE INTO attendance_log t " +
            "USING (SELECT ? AS customer_id, ? AS record_date FROM dual) s " +
            "ON (t.customer_id = s.customer_id AND t.record_date = s.record_date) " +
            "WHEN NOT MATCHED THEN INSERT (customer_id, record_date) VALUES (s.customer_id, s.record_date)",
            ps -> {
                ps.setLong(1, customerId);
                ps.setDate(2, Date.valueOf(day));
            }
        );

        return status(email);
    }
}
