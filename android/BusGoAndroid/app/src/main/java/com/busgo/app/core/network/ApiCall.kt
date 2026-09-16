package com.busgo.app.core.network

import kotlinx.serialization.json.Json
import retrofit2.HttpException
import java.io.IOException

/** Runs a Retrofit suspend call, unwrapping the success envelope or mapping failures into [NetworkResult.Error]. */
suspend fun <T> safeApiCall(json: Json, block: suspend () -> ApiSuccessEnvelope<T>): NetworkResult<T> {
    return try {
        NetworkResult.Success(block().data)
    } catch (e: HttpException) {
        val errorBody = e.response()?.errorBody()?.string()
        val parsed = errorBody?.let {
            runCatching { json.decodeFromString(ApiErrorEnvelope.serializer(), it) }.getOrNull()
        }
        NetworkResult.Error(
            code = parsed?.error?.code ?: "HTTP_${e.code()}",
            message = parsed?.error?.message ?: e.message() ?: "Request failed",
            httpStatus = e.code(),
        )
    } catch (e: IOException) {
        NetworkResult.Error(code = "NETWORK_ERROR", message = "No internet connection")
    }
}
