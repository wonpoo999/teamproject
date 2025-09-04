package com.example.health_care.controller;

import com.example.health_care.dto.AccountProfileResponse;
import com.example.health_care.dto.ChangePasswordRequest;
import com.example.health_care.dto.UpdateAccountProfileRequest;
import com.example.health_care.service.AccountV2Service;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account/v2")
@RequiredArgsConstructor
public class AccountV2Controller {

    private final AccountV2Service service;

    @GetMapping("/me")
    public AccountProfileResponse me(@AuthenticationPrincipal User user) {
        return service.getProfile(user.getUsername());
    }

    @PutMapping("/me")
    public AccountProfileResponse updateMe(@AuthenticationPrincipal User user,
                                           @Valid @RequestBody UpdateAccountProfileRequest req) {
        return service.updateProfile(user.getUsername(), req);
    }

    @PutMapping("/password")
    public void changePassword(@AuthenticationPrincipal User user,
                               @Valid @RequestBody ChangePasswordRequest req) {
        service.changePassword(user.getUsername(), req);
    }
}
