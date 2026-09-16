package com.busgo.app.core.network

import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

@Serializable
data class HealthStatus(val status: String, val timestamp: String)

/**
 * Root API surface. Endpoint interfaces for search, bookings, payments, etc.
 * are added module-by-module as those backend routes come online.
 */
interface ApiService {
    @GET("health")
    suspend fun getHealth(): ApiSuccessEnvelope<HealthStatus>

    @POST("auth/otp/request")
    suspend fun requestOtp(@Body body: OtpRequestBody): ApiSuccessEnvelope<OtpRequestResponse>

    @POST("auth/otp/verify")
    suspend fun verifyOtp(@Body body: OtpVerifyBody): ApiSuccessEnvelope<AuthSession>

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequestBody): ApiSuccessEnvelope<TokenPair>

    @POST("auth/logout")
    suspend fun logout(@Body body: RefreshRequestBody): ApiSuccessEnvelope<LogoutResult>

    @GET("auth/me")
    suspend fun getMe(): ApiSuccessEnvelope<UserProfile>
}
