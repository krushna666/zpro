package com.busgo.app.core.network

import com.busgo.app.BuildConfig
import com.busgo.app.data.local.datastore.SessionDataStore
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import java.util.concurrent.TimeUnit
import javax.inject.Inject

/**
 * Handles 401 responses by exchanging the stored refresh token for a new
 * session (POST /auth/refresh) and retrying the original request once. Uses
 * its own bare OkHttpClient for the refresh call to avoid recursing back
 * into this same authenticator/interceptor pair.
 */
class TokenAuthenticator @Inject constructor(
    private val sessionDataStore: SessionDataStore,
    private val json: Json,
) : Authenticator {

    private val refreshHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null

        val refreshToken = runBlocking { sessionDataStore.refreshTokenOnce() }
        if (refreshToken.isNullOrBlank()) {
            runBlocking { sessionDataStore.clearSession() }
            return null
        }

        val newTokens = requestNewTokens(refreshToken)
        if (newTokens == null) {
            runBlocking { sessionDataStore.clearSession() }
            return null
        }

        runBlocking { sessionDataStore.saveTokens(newTokens.accessToken, newTokens.refreshToken) }
        return response.request.newBuilder()
            .header("Authorization", "Bearer ${newTokens.accessToken}")
            .build()
    }

    private fun requestNewTokens(refreshToken: String): TokenPair? {
        return try {
            val requestBody = json.encodeToString(
                RefreshRequestBody.serializer(),
                RefreshRequestBody(refreshToken),
            ).toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url(BuildConfig.API_BASE_URL + "auth/refresh")
                .post(requestBody)
                .build()

            refreshHttpClient.newCall(request).execute().use { httpResponse ->
                if (!httpResponse.isSuccessful) return null
                val body = httpResponse.body?.string() ?: return null
                val envelope = json.decodeFromString(
                    ApiSuccessEnvelope.serializer(TokenPair.serializer()),
                    body,
                )
                envelope.data
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var result = 1
        var prior = response.priorResponse
        while (prior != null) {
            result++
            prior = prior.priorResponse
        }
        return result
    }
}
