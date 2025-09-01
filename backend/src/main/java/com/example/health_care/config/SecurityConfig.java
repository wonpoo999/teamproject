package com.example.health_care.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.example.health_care.service.CustomersService;

@RequiredArgsConstructor
@Configuration
public class SecurityConfig {
private CustomersService customersService;
    // swagger 문서 접근 허용 목록
    private static final String[] SWAGGER_WHITELIST = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    // 공개 허용 (개발용)
    private static final String[] PUBLIC_WHITELIST = {
            "/api/ping",        // 헬스 체크
            "/api/auth/**",     // 로그인/회원가입 등
            "/error"            // 스프링 기본 에러 엔드포인트
    };


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CORS는 별도 CorsConfig Bean 사용
            .cors(Customizer.withDefaults())
            // CSRF: REST API(JWT) 기준 off
            .csrf(csrf -> csrf.disable())
            // 세션 사용하지 않음 (JWT 전제)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 인가 규칙
            .authorizeHttpRequests(auth -> auth
                // 사전 허용
                .requestMatchers(SWAGGER_WHITELIST).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(PUBLIC_WHITELIST).permitAll()

                // (개발 중에는 POST 전체 허용이 필요하면 아래 라인 살리고,
                //  운영에선 꼭 구체 경로로 좁혀줘)
                .requestMatchers(HttpMethod.POST, "/**").permitAll()

                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )
            // 폼/베이직 로그인 비활성
            .httpBasic(b -> b.disable())
            .formLogin(f -> f.disable());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
    
}
