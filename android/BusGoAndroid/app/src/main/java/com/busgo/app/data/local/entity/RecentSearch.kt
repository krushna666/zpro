package com.busgo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "recent_searches")
data class RecentSearch(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sourceCityId: String,
    val sourceCityName: String,
    val destinationCityId: String,
    val destinationCityName: String,
    val searchedAtEpochMillis: Long,
)
