package com.example.health_care.service;

import java.util.Map;

import com.example.health_care.dto.AccountProfileResponse;
import com.example.health_care.dto.ChangePasswordRequest;
import com.example.health_care.dto.UpdateAccountProfileRequest;
import com.example.health_care.repository.AccountJdbcRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("accountServiceV2")
@RequiredArgsConstructor
public class AccountV2Service {

    private final AccountJdbcRepository repo;
    private final PasswordEncoder encoder;

    @Transactional(readOnly = true)
    public AccountProfileResponse getProfile(String id) {
        Map<String,Object> row = repo.findProfileById(id);
        if (row == null) throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id);
        return map(row);
    }

    @Transactional
    public AccountProfileResponse updateProfile(String id, UpdateAccountProfileRequest req) {
        // 현재 값 조회
        Map<String,Object> cur = repo.findProfileById(id);
        if (cur == null) throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id);

        // null 은 기존 값 유지
        Double weight = req.getWeight() != null ? req.getWeight() : toD(cur.get("WEIGHT"));
        Integer age   = req.getAge()   != null ? req.getAge()   : toI(cur.get("AGE"));
        String gender = req.getGender()!= null ? req.getGender(): (String) cur.get("GENDER");
        Double height = req.getHeight()!= null ? req.getHeight(): toD(cur.get("HEIGHT"));

        repo.updateCore(id, weight, age, gender, height);

        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            // 이메일 중복 체크(자기 자신 제외)
            if (repo.countEmailInUse(id, req.getEmail()) > 0) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
            }
            repo.updateEmail(id, req.getEmail());
        }

        return getProfile(id);
    }

    @Transactional
    public void changePassword(String id, ChangePasswordRequest req) {
        String hash = repo.findPasswordHash(id);
        if (hash == null) throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id);
        if (!encoder.matches(req.getCurrentPassword(), hash)) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        repo.updatePassword(id, encoder.encode(req.getNewPassword()));
    }

    private static AccountProfileResponse map(Map<String,Object> r) {
        return AccountProfileResponse.builder()
                .id((String) r.get("ID"))
                .email((String) r.get("EMAIL"))
                .weight(toD(r.get("WEIGHT")))
                .age(toI(r.get("AGE")))
                .gender((String) r.get("GENDER"))
                .height(toD(r.get("HEIGHT")))
                .build();
    }
    private static Double toD(Object o){ return o==null?null:((Number)o).doubleValue(); }
    private static Integer toI(Object o){ return o==null?null:((Number)o).intValue(); }
}
