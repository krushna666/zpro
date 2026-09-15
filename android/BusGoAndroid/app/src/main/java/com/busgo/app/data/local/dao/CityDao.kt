package com.busgo.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.busgo.app.data.local.entity.CachedCity
import kotlinx.coroutines.flow.Flow

@Dao
interface CityDao {
    @Query("SELECT * FROM cached_cities ORDER BY isPopular DESC, name ASC")
    fun observeAll(): Flow<List<CachedCity>>

    @Query("SELECT * FROM cached_cities WHERE name LIKE '%' || :query || '%' LIMIT 20")
    suspend fun search(query: String): List<CachedCity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(cities: List<CachedCity>)

    @Query("DELETE FROM cached_cities")
    suspend fun clear()
}
