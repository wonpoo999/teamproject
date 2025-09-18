// src/main/java/com/example/health_care/controller/AttendanceController.java
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

        // 오늘 미로그인이라면 어제부터 역산
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

    /** 최초 로그인일 */
    @GetMapping("/first-login")
    public Map<String, Object> firstLogin(@RequestParam(name = "email", required = false) String email) {
        final Long customerId = findCustomerIdByEmail(email);
        LocalDate first = LocalDate.now(ZoneId.of("Asia/Seoul"));
        if (customerId != null) {
            Date d = jdbc.queryForObject(
                    "SELECT MIN(record_date) FROM attendance_log WHERE customer_id = ?",
                    Date.class, customerId
            );
            if (d != null) first = d.toLocalDate();
        }
        return Map.of("firstDate", first.toString());
    }

    /** 상태 집계(주말/공휴일 예외 없이 '달력일' 기준) */
    @GetMapping("/status")
    public Map<String, Object> status(@RequestParam(name = "email", required = false) String email) {
        final Long customerId = findCustomerIdByEmail(email);
        final LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

        final Set<LocalDate> loginDays = loadLoginDates(customerId);
        final LocalDate firstDate = loginDays.stream().findFirst().orElse(today);
        final LocalDate lastDate  = loginDays.stream().reduce((a,b)->b).orElse(today);

        final int totalDays = loginDays.size();
        final int currentStreak = computeCalendarStreak(loginDays, today);

        final YearMonth ymNow = YearMonth.from(today);
        final int monthDays = (int) loginDays.stream().filter(d -> YearMonth.from(d).equals(ymNow)).count();

        // 월초부터 오늘까지 '매일' 로그인 이어졌는지 (오늘 미로그인이면 어제까지만 성립)
        int monthStreak = 0;
        {
            LocalDate end = loginDays.contains(today) ? today : today.minusDays(1);
            LocalDate d = ymNow.atDay(1);
            while (!d.isAfter(end)) {
                if (!loginDays.contains(d)) break;
                monthStreak++;
                d = d.plusDays(1);
            }
        }

        // 코인: 누적 규칙
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
}
