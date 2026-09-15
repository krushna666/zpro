package com.busgo.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.busgo.app.data.local.dao.BookingDao
import com.busgo.app.data.local.dao.CityDao
import com.busgo.app.data.local.dao.RecentSearchDao
import com.busgo.app.data.local.entity.CachedBooking
import com.busgo.app.data.local.entity.CachedCity
import com.busgo.app.data.local.entity.RecentSearch

@Database(
    entities = [CachedCity::class, RecentSearch::class, CachedBooking::class],
    version = 1,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun cityDao(): CityDao
    abstract fun recentSearchDao(): RecentSearchDao
    abstract fun bookingDao(): BookingDao

    companion object {
        const val DATABASE_NAME = "busgo.db"
    }
}
