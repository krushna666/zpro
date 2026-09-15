package com.busgo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_bookings")
data class CachedBooking(
    @PrimaryKey val id: String,
    val bookingCode: String,
    val status: String,
    val operatorName: String,
    val sourceCityName: String,
    val destinationCityName: String,
    val departureAtEpochMillis: Long,
    val totalAmount: Double,
    val cachedAtEpochMillis: Long,
)
