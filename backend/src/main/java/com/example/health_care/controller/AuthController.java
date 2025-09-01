package com.example.health_care.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.health_care.dto.LoginRequest;
import com.example.health_care.dto.LoginResponse;
import com.example.health_care.dto.SignupRequest;
import com.example.health_care.entity.CustomersEntity;
import com.example.health_care.security.JwtTokenProvider;
import com.example.health_care.service.CustomersService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {


    private final CustomersService customersService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/signup")
    public ResponseEntity<CustomersEntity> signup(@Valid @RequestBody SignupRequest request) {
        log.info("[SIGNUP] request id = {}, weight = {}, age = {}, gender = {}, height = {}", request.getId(), request.getWeight(), request.getAge(), request.getGender(), request.getHeight()); // log 확인
        CustomersEntity saved = customersService.signup(request);
        log.info("[SIGNUP] saved id = {}", saved.getId()); // log 확인
        return ResponseEntity.created(URI.create("/api/users/" + saved.getId()))
                .body(saved);
    }


 @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            // 사용자 인증
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getId(),
                            request.getPassword()));

            // JWT 토큰 생성
            String token = jwtTokenProvider.createToken(authentication);

            // 사용자 정보 조회 -> Principal만 가져오기
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            LoginResponse response = LoginResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .id(userDetails.getUsername())
                    .build();

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid credentials");

        }
    }
}
