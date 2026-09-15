package com.busgo.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.busgo.app.data.local.entity.CachedBooking
import kotlinx.coroutines.flow.Flow

@Dao
interface BookingDao {
    @Query("SELECT * FROM cached_bookings ORDER BY departureAtEpochMillis DESC")
    fun observeAll(): Flow<List<CachedBooking>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(bookings: List<CachedBooking>)
}
