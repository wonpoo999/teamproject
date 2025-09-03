package com.example.health_care.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.health_care.entity.BodyEntity;

public interface BodyRepository extends JpaRepository<BodyEntity, Long> {

    // 최신 1건 (가장 큰 idx = 가장 최근이라고 가정)
    Optional<BodyEntity> findTopByCustomer_IdxOrderByIdxDesc(Long customerIdx);

    // 이력 전체 (최신순)
    List<BodyEntity> findByCustomer_IdxOrderByIdxDesc(Long customerIdx);
}