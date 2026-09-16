package com.busgo.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busgo.app.core.network.ApiService
import com.busgo.app.core.network.NetworkResult
import com.busgo.app.core.network.OtpRequestBody
import com.busgo.app.core.network.safeApiCall
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import javax.inject.Inject

sealed interface LoginUiState {
    data object Idle : LoginUiState
    data object Loading : LoginUiState
    data class OtpSent(val phone: String) : LoginUiState
    data class Error(val message: String) : LoginUiState
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val apiService: ApiService,
    private val json: Json,
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState

    fun requestOtp(phone: String) {
        if (_uiState.value == LoginUiState.Loading) return
        _uiState.value = LoginUiState.Loading
        viewModelScope.launch {
            when (val result = safeApiCall(json) { apiService.requestOtp(OtpRequestBody(phone)) }) {
                is NetworkResult.Success -> _uiState.value = LoginUiState.OtpSent(phone)
                is NetworkResult.Error -> _uiState.value = LoginUiState.Error(result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    /** Called once navigation has consumed an [LoginUiState.OtpSent] event, so it doesn't refire. */
    fun resetToIdle() {
        _uiState.value = LoginUiState.Idle
    }
}
