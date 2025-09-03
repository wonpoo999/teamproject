package com.example.health_care.repository;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.health_care.entity.BodyEntity;

public interface BodyRepository extends JpaRepository<BodyEntity, Integer> {
    // 고객 ID(customer_id)로 body 엔티티를 찾아오는 메서드
    List<BodyEntity> findByCustomerId(Integer customerId);
}