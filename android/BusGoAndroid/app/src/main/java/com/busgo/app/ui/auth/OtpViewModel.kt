package com.busgo.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busgo.app.core.network.ApiService
import com.busgo.app.core.network.NetworkResult
import com.busgo.app.core.network.OtpRequestBody
import com.busgo.app.core.network.OtpVerifyBody
import com.busgo.app.core.network.safeApiCall
import com.busgo.app.data.local.datastore.SessionDataStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import javax.inject.Inject

sealed interface OtpUiState {
    data object Idle : OtpUiState
    data object Verifying : OtpUiState
    data object Verified : OtpUiState
    data object Resending : OtpUiState
    data class Error(val message: String) : OtpUiState
}

@HiltViewModel
class OtpViewModel @Inject constructor(
    private val apiService: ApiService,
    private val sessionDataStore: SessionDataStore,
    private val json: Json,
) : ViewModel() {

    private val _uiState = MutableStateFlow<OtpUiState>(OtpUiState.Idle)
    val uiState: StateFlow<OtpUiState> = _uiState

    fun verifyOtp(phone: String, code: String) {
        if (_uiState.value is OtpUiState.Verifying) return
        _uiState.value = OtpUiState.Verifying
        viewModelScope.launch {
            when (val result = safeApiCall(json) { apiService.verifyOtp(OtpVerifyBody(phone = phone, code = code)) }) {
                is NetworkResult.Success -> {
                    val session = result.data
                    sessionDataStore.saveSession(session.user.id, session.accessToken, session.refreshToken)
                    _uiState.value = OtpUiState.Verified
                }
                is NetworkResult.Error -> _uiState.value = OtpUiState.Error(result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    fun resendOtp(phone: String) {
        if (_uiState.value is OtpUiState.Resending) return
        _uiState.value = OtpUiState.Resending
        viewModelScope.launch {
            when (val result = safeApiCall(json) { apiService.requestOtp(OtpRequestBody(phone)) }) {
                is NetworkResult.Success -> _uiState.value = OtpUiState.Idle
                is NetworkResult.Error -> _uiState.value = OtpUiState.Error(result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }
}
