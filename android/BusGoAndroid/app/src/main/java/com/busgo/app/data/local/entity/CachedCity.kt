package com.busgo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_cities")
data class CachedCity(
    @PrimaryKey val id: String,
    val name: String,
    val state: String,
    val latitude: Double,
    val longitude: Double,
    val isPopular: Boolean,
)
