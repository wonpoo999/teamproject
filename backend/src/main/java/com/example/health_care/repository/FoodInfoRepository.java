package com.example.health_care.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.health_care.entity.FoodInfoEntity;

public interface FoodInfoRepository extends JpaRepository<FoodInfoEntity, String> {

    Optional<FoodInfoEntity> findByFoodNameIgnoreCase(String foodName);

    boolean existsByFoodNameIgnoreCase(String foodName);

}