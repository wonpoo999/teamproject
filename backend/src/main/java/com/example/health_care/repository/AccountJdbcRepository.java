package com.example.health_care.repository;

import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository("accountRepoV2")
@RequiredArgsConstructor
public class AccountJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public Map<String, Object> findProfileById(String id) {
        var sql = """
            select id, email, weight, age, gender, height
              from customers
             where lower(id)=lower(:id)
             fetch first 1 rows only
            """;
        return jdbc.query(sql,
                new MapSqlParameterSource("id", id),
                rs -> rs.next() ? Map.of(
                        "ID", rs.getString("id"),
                        "EMAIL", rs.getString("email"),
                        "WEIGHT", (Object) rs.getObject("weight"),
                        "AGE", (Object) rs.getObject("age"),
                        "GENDER", rs.getString("gender"),
                        "HEIGHT", (Object) rs.getObject("height")
                ) : null
        );
    }

    public int countEmailInUse(String id, String email) {
        var sql = """
            select count(1)
              from customers
             where lower(email)=lower(:email)
               and lower(id)<>lower(:id)
            """;
        return jdbc.queryForObject(sql,
                new MapSqlParameterSource()
                        .addValue("email", email)
                        .addValue("id", id),
                Integer.class);
    }

    public int updateCore(String id, Double weight, Integer age, String gender, Double height) {
        var sql = """
            update customers
               set weight=:weight,
                   age=:age,
                   gender=:gender,
                   height=:height
             where lower(id)=lower(:id)
            """;
        return jdbc.update(sql, new MapSqlParameterSource()
                .addValue("weight", weight)
                .addValue("age", age)
                .addValue("gender", gender)
                .addValue("height", height)
                .addValue("id", id));
    }

    public int updateEmail(String id, String email) {
        var sql = "update customers set email=:email where lower(id)=lower(:id)";
        return jdbc.update(sql, new MapSqlParameterSource()
                .addValue("email", email)
                .addValue("id", id));
    }

    public String findPasswordHash(String id) {
        var sql = "select password from customers where lower(id)=lower(:id)";
        return jdbc.query(sql, new MapSqlParameterSource("id", id),
                rs -> rs.next() ? rs.getString(1) : null);
    }

    public int updatePassword(String id, String encoded) {
        var sql = "update customers set password=:pwd where lower(id)=lower(:id)";
        return jdbc.update(sql, new MapSqlParameterSource()
                .addValue("pwd", encoded)
                .addValue("id", id));
    }
}
