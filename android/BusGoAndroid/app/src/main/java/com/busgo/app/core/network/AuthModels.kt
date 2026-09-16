package com.busgo.app.core.network

import kotlinx.serialization.Serializable

@Serializable
data class OtpRequestBody(val phone: String)

@Serializable
data class OtpRequestResponse(val expiresInSeconds: Int, val devCode: String? = null)

@Serializable
data class OtpVerifyBody(
    val phone: String,
    val code: String,
    val fullName: String? = null,
    val deviceId: String? = null,
)

@Serializable
data class UserProfile(
    val id: String,
    val fullName: String,
    val email: String? = null,
    val phone: String? = null,
    val roles: List<String> = emptyList(),
    val avatarUrl: String? = null,
    val phoneVerifiedAt: String? = null,
    val emailVerifiedAt: String? = null,
    val languagePreference: String = "en",
)

@Serializable
data class AuthSession(
    val user: UserProfile,
    val accessToken: String,
    val refreshToken: String,
    val isNewUser: Boolean = false,
)

@Serializable
data class RefreshRequestBody(val refreshToken: String)

@Serializable
data class TokenPair(val accessToken: String, val refreshToken: String)

@Serializable
data class LogoutResult(val success: Boolean = true)
