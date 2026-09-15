package com.busgo.app.core.network

import kotlinx.serialization.Serializable

@Serializable
data class ApiSuccessEnvelope<T>(
    val success: Boolean,
    val data: T,
    val message: String,
)

@Serializable
data class ApiErrorEnvelope(
    val success: Boolean,
    val error: ApiErrorBody,
)

@Serializable
data class ApiErrorBody(
    val code: String,
    val message: String,
)
