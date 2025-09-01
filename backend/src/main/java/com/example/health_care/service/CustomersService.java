package com.example.health_care.service;

import com.example.health_care.dto.SignupRequest;
import com.example.health_care.entity.CustomersEntity;
import com.example.health_care.repository.CustomersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@RequiredArgsConstructor
@Service
public class CustomersService {

    private final CustomersRepository customersRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public CustomersEntity signup(SignupRequest req) {
        log.debug("[SIGNUP:SERVICE] existsById? id={}", req.getId()); // log 확인
        if (customersRepository.existsById(req.getId())) {
            log.warn("[SIGNUP:SERVICE] duplicate id={}", req.getId());
            throw new IllegalArgumentException("이미 존재하는 ID입니다.");
        }

        CustomersEntity user = CustomersEntity.builder()
                .id(req.getId())
                .password(passwordEncoder.encode(req.getPassword())) // 비밀번호 암호화
                .weight(req.getWeight())
                .age(req.getAge())
                .gender(req.getGender())
                .height(req.getHeight())
                .build();
                
        return customersRepository.save(user);
    }
}
