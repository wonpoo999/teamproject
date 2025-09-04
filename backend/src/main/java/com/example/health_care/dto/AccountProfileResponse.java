package com.example.health_care.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccountProfileResponse {
    private String id;
    private String email;
    private Double weight;
    private Integer age;
    private String gender; // "M" / "F"
    private Double height;
}
