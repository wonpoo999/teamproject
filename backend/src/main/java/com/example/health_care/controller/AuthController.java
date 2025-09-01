package com.example.health_care.controller;

import com.example.health_care.dto.SignupRequest;
import com.example.health_care.entity.CustomersEntity;
import com.example.health_care.service.CustomersService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CustomersService customersService;

    @PostMapping("/signup")
    public ResponseEntity<CustomersEntity> signup(@Valid @RequestBody SignupRequest request) {
        log.info("[SIGNUP] request id = {}, weight = {}, age = {}, gender = {}, height = {}", request.getId(), request.getWeight(), request.getAge(), request.getGender(), request.getHeight()); // log 확인
        CustomersEntity saved = customersService.signup(request);
        log.info("[SIGNUP] saved id = {}", saved.getId()); // log 확인
        return ResponseEntity.created(URI.create("/api/users/" + saved.getId()))
                .body(saved);
    }

    // 서버 통신 확인 메소드 : 살아있으면 "pong" 반환 // 서비스 배포 전에 삭제해주기
    @RestController
    public class PingController {
        @GetMapping("/api/ping")
        public String ping() {
            return "pong";
        }
    }
}
