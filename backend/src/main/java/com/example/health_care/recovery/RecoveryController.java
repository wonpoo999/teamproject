package com.example.health_care.recovery;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.example.health_care.service.CustomersService;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 비밀번호 복구 모듈 (모든 구성요소를 한 파일로 통합)
 *
 * - [로그인 필요]  PUT /api/profile/security-questions
 *      본인 계정에 질문 3개/답(확인 포함) 등록 또는 수정
 *
 * - [공개]        POST /api/recover/start
 *      { id } → 등록된 4개 중 임의의 2개 질문 code 반환
 *
 * - [공개]        POST /api/recover/verify
 *      { id, answers:[{code, answer}, ...](2개) } → 정답이면 recoveryToken 발급
 *
 * - [공개]        POST /api/recover/reset
 *      { recoveryToken, newPassword } → 비밀번호 재설정
 */

// ======================= Controller =======================
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RecoveryController {

    private final RecoveryService service;

    // >>> [ADDED] 보안질문 등록/수정(3개) - 로그인 필요
    @PutMapping("/profile/security-questions")
    public ResponseEntity<?> setQuestions(@AuthenticationPrincipal UserDetails user,
                                          @Valid @RequestBody SetSecurityQuestionsRequest req) {
        service.setQuestions(user.getUsername(), req.getAnswers());
        return ResponseEntity.noContent().build();
    }

    // >>> [ADDED] 복구 시작: 이메일(ID) → 랜덤 2개 코드
    @PostMapping("/recover/start")
    public ResponseEntity<?> start(@Valid @RequestBody RecoverStartRequest req) {
        try {
            List<RecoveryQuestionCode> two = service.pickTwo(req.getId());
            return ResponseEntity.ok(new RecoverStartResponse(req.getId(), two));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "보안 질문이 설정되지 않았습니다."));
        }
    }

    // >>> [ADDED] 2개 답 검증 → 단기 토큰 발급
    @PostMapping("/recover/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody RecoverVerifyRequest req) {
        Map<RecoveryQuestionCode, String> map = req.getAnswers().stream()
                .collect(Collectors.toMap(RecoverVerifyRequest.Ans::getCode, RecoverVerifyRequest.Ans::getAnswer));
        boolean ok = service.verifyAnswers(req.getId(), map);
        if (!ok) return ResponseEntity.badRequest().body(Map.of("message", "답이 올바르지 않습니다."));
        String token = service.createRecoveryToken(req.getId());
        return ResponseEntity.ok(RecoverVerifyResponse.builder().recoveryToken(token).build());
    }

    // >>> [ADDED] 토큰으로 비번 재설정
    @PostMapping("/recover/reset")
    public ResponseEntity<?> reset(@Valid @RequestBody ResetPasswordRequest req) {
        boolean changed = service.resetPasswordWithToken(req.getRecoveryToken(), req.getNewPassword());
        if (!changed) return ResponseEntity.badRequest().body(Map.of("message", "토큰이 유효하지 않거나 만료되었습니다."));
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }
}

// ======================= Service =======================
@Service
@RequiredArgsConstructor
class RecoveryService {

    private final RecoveryRepository repo;
    private final PasswordEncoder encoder;
    private final CustomersService customersService; // 비번 업데이트 공용 사용
    private final TokenTool tokenTool;

    private String norm(String s){ return s==null? "" : s.trim().toLowerCase(); }

    @Transactional
    public void setQuestions(String customerId, List<SetSecurityQuestionsRequest.Item> items) {
        if (items == null || items.size() < 3) throw new IllegalArgumentException("3개의 질문/답이 필요합니다.");

        Set<RecoveryQuestionCode> codes = new HashSet<>();
        for (var it : items) {
            if (!Objects.equals(it.getAnswer(), it.getConfirm()))
                throw new IllegalArgumentException("답과 확인이 일치하지 않습니다.");
            if (!codes.add(it.getCode()))
                throw new IllegalArgumentException("질문 코드가 중복되었습니다.");
        }

        // 저장(3개)
        for (var it : items) {
            var opt = repo.findByCustomerIdAndCode(customerId, it.getCode());
            RecoveryEntity e = opt.orElseGet(() -> RecoveryEntity.builder()
                    .customerId(customerId)
                    .code(it.getCode())
                    .build());
            e.setAnswerHash(encoder.encode(norm(it.getAnswer())));
            e.setUpdatedAt(LocalDateTime.now());
            repo.save(e);
        }
    }

    @Transactional(readOnly = true)
    public List<RecoveryQuestionCode> pickTwo(String customerId) {
        List<RecoveryEntity> all = repo.findByCustomerId(customerId);
        if (all.size() < 3) throw new IllegalStateException("보안질문 미설정");
        List<RecoveryQuestionCode> codes = all.stream().map(RecoveryEntity::getCode).collect(Collectors.toList());
        Collections.shuffle(codes);
        return codes.subList(0, 2);
    }

    @Transactional(readOnly = true)
    public boolean verifyAnswers(String customerId, Map<RecoveryQuestionCode, String> provided) {
        List<RecoveryEntity> all = repo.findByCustomerId(customerId);
        Map<RecoveryQuestionCode, String> hashByCode = all.stream()
                .collect(Collectors.toMap(RecoveryEntity::getCode, RecoveryEntity::getAnswerHash));
        for (var entry : provided.entrySet()) {
            RecoveryQuestionCode code = entry.getKey();
            String ans = norm(entry.getValue());
            String hash = hashByCode.get(code);
            if (hash == null || !encoder.matches(ans, hash)) return false;
        }
        return true;
    }

    // 단기 토큰 발급/검증은 TokenTool 위임
    public String createRecoveryToken(String userId) { return tokenTool.create(userId); }
    public String parseRecoveryToken(String token) { return tokenTool.parse(token); }

    @Transactional
    public boolean resetPasswordWithToken(String recoveryToken, String newPassword) {
        String uid = parseRecoveryToken(recoveryToken);
        if (uid == null) return false;
        customersService.updatePassword(uid, newPassword);
        return true;
    }
}

// ======================= TokenTool (JWT Provider 분리 래퍼) =======================
@Component
@RequiredArgsConstructor
class TokenTool {
    private final com.example.health_care.security.JwtTokenProvider jwt;

    public String create(String userId){ return jwt.createRecoveryToken(userId); }
    public String parse(String token){ return jwt.validateAndGetUserFromRecoveryToken(token); }
}

// ======================= Repository =======================
interface RecoveryRepository extends JpaRepository<RecoveryEntity, Long> {
    List<RecoveryEntity> findByCustomerId(String customerId);
    Optional<RecoveryEntity> findByCustomerIdAndCode(String customerId, RecoveryQuestionCode code);
}

// ======================= Entity =======================
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "recovery", uniqueConstraints = {
        @UniqueConstraint(name = "uq_recovery_user_code", columnNames = {"customer_id", "code"})
})
class RecoveryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idx")
    private Long idx;

    @Column(name = "customer_id", length = 100, nullable = false)
    private String customerId; // customers.id (문자열 이메일)

    @Enumerated(EnumType.STRING)
    @Column(name = "code", length = 32, nullable = false)
    private RecoveryQuestionCode code;

    @Column(name = "answer_hash", length = 255, nullable = false)
    private String answerHash;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

// ======================= Enum =======================
enum RecoveryQuestionCode {
    BIRTHPLACE,         // 내가 태어난 곳은?
    ELEMENTARY_SCHOOL,  // 내가 다니던 초등학교는?
    PET_NAME,           // 내 애완동물 이름은?
    MOTHER_NAME         // 내 어머니 이름은?
}

// ======================= DTOs =======================
@Getter @Setter
class SetSecurityQuestionsRequest {
    @Size(min = 3, max = 3)
    @Valid
    private List<Item> answers;

    @Getter @Setter
    public static class Item {
        @NotNull
        private RecoveryQuestionCode code;
        @NotBlank
        private String answer;
        @NotBlank
        private String confirm;
    }
}

@Getter @Setter @AllArgsConstructor
class RecoverStartRequest {
    @NotBlank
    private String id;
}

@Getter @Setter @AllArgsConstructor
class RecoverStartResponse {
    private String id;
    private List<RecoveryQuestionCode> questions;
}

@Getter @Setter
class RecoverVerifyRequest {
    @NotBlank
    private String id;
    @Size(min = 2, max = 2)
    @Valid
    private List<Ans> answers;

    @Getter @Setter
    public static class Ans {
        @NotNull
        private RecoveryQuestionCode code;
        @NotBlank
        private String answer;
    }
}

@Getter @Setter @Builder
class RecoverVerifyResponse {
    private String recoveryToken;
}

@Getter @Setter
class ResetPasswordRequest {
    @NotBlank
    private String recoveryToken;
    @NotBlank
    @Size(min = 8, max = 64)
    private String newPassword;
}
