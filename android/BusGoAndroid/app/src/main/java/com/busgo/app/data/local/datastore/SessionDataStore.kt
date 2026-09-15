package com.busgo.app.data.local.datastore

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionDataStore @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    private object Keys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_ID = stringPreferencesKey("user_id")
    }

    val accessToken: Flow<String?> = dataStore.data.map { it[Keys.ACCESS_TOKEN] }
    val isLoggedIn: Flow<Boolean> = dataStore.data.map { !it[Keys.ACCESS_TOKEN].isNullOrBlank() }

    suspend fun accessTokenOnce(): String? = dataStore.data.first()[Keys.ACCESS_TOKEN]
    suspend fun refreshTokenOnce(): String? = dataStore.data.first()[Keys.REFRESH_TOKEN]

    suspend fun saveSession(userId: String, accessToken: String, refreshToken: String) {
        dataStore.edit { prefs ->
            prefs[Keys.USER_ID] = userId
            prefs[Keys.ACCESS_TOKEN] = accessToken
            prefs[Keys.REFRESH_TOKEN] = refreshToken
        }
    }

    suspend fun saveAccessToken(accessToken: String) {
        dataStore.edit { prefs -> prefs[Keys.ACCESS_TOKEN] = accessToken }
    }

    suspend fun clearSession() {
        dataStore.edit { it.clear() }
    }
}
