package com.example.health_care.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.health_care.entity.BodyEntity;

public interface BodyRepository extends JpaRepository<BodyEntity, Long> {

    // 고객 이력 전체(최신순)
    List<BodyEntity> findByCustomer_IdxOrderByCreatedAtDesc(Long customerIdx);

    // 최신 1건
    Optional<BodyEntity> findTopByCustomer_IdxOrderByCreatedAtDesc(Long customerIdx);
}
