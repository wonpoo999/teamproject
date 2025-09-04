package com.example.health_care.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "foodInfo")
public class FoodInfoEntity {

    @Id
    @Column(name = "food_name", length = 100)
    private String foodName;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "count")
    private Integer count;
}
