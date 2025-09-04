package com.example.health_care.controller;

import com.example.health_care.service.CustomersService;
import com.example.health_care.dto.CustomersProfileDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/body")
public class GoalController {

    private final CustomersService customersService;

    // 프론트엔드에서 GET /body 요청이 오면 이 메서드가 처리
    @GetMapping 
    public ResponseEntity<CustomersProfileDTO> getCustomerInfo(Authentication authentication) {
        String customerId = authentication.getName();
        
        CustomersProfileDTO cpd = customersService.getCustomerProfile(customerId);
        
        if (cpd != null) {
            return ResponseEntity.ok(cpd);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}