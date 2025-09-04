package com.example.health_care.dto;

import jakarta.validation.constraints.Email;
import lombok.*;

@Getter @Setter @ToString
public class UpdateAccountProfileRequest {
    private Double weight;  // null이면 기존값 유지
    private Integer age;    // null이면 기존값 유지
    private String gender;  // null이면 기존값 유지 ("M"|"F")
    private Double height;  // null이면 기존값 유지

    @Email
    private String email;   // 선택 입력. null이면 변경 안 함
}
