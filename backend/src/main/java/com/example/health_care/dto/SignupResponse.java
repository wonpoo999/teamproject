package com.example.health_care.dto;

import com.example.health_care.entity.CustomersEntity.Gender;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupResponse {
    private String id;
    private Double weight;
    private Integer age;
    private Gender gender;
    private Double height;

    private String accessToken; // JTW
    private String tokenType; // "Bearer"
    private long expiresIn; // 만료 시간(초) <- 추가해두면 프론트가 토큰 관리 편리함.
}
