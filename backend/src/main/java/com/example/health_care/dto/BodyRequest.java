package com.example.health_care.dto;
import java.util.Date;

import com.example.health_care.entity.Gender;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BodyRequest {
@Positive
    @Digits(integer = 5, fraction = 2) // 소수점 2자리까지
    private Double inbody;
}