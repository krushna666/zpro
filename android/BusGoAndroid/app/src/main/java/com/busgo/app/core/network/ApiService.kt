package com.busgo.app.core.network

import kotlinx.serialization.Serializable
import retrofit2.http.GET

@Serializable
data class HealthStatus(val status: String, val timestamp: String)

/**
 * Root API surface. Endpoint interfaces for auth, search, bookings, payments, etc.
 * are added module-by-module as those backend routes come online.
 */
interface ApiService {
    @GET("health")
    suspend fun getHealth(): ApiSuccessEnvelope<HealthStatus>
}
