package com.example.health_care.repository;

import com.example.health_care.entity.CustomersEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomersRepository extends JpaRepository<CustomersEntity, String> {
}
