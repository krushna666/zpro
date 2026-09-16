package com.busgo.app.ui.auth

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.busgo.app.R
import kotlinx.coroutines.delay

private const val RESEND_COOLDOWN_SECONDS = 30

/** OTP entry step: verifies the code against the backend and hands off to Home on success. */
@Composable
fun OtpScreen(
    phone: String,
    onVerified: () -> Unit,
    viewModel: OtpViewModel = hiltViewModel(),
) {
    var code by remember { mutableStateOf("") }
    var resendSecondsLeft by remember { mutableIntStateOf(RESEND_COOLDOWN_SECONDS) }
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is OtpUiState.Verified) {
            onVerified()
        }
    }

    LaunchedEffect(resendSecondsLeft) {
        if (resendSecondsLeft > 0) {
            delay(1000)
            resendSecondsLeft -= 1
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = stringResource(R.string.otp_title),
            style = MaterialTheme.typography.headlineMedium,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.otp_subtitle, phone),
            style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(
            value = code,
            onValueChange = { if (it.length <= 6) code = it.filter(Char::isDigit) },
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = KeyboardType.NumberPassword,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { viewModel.verifyOtp(phone, code) },
            enabled = code.length == 6 && uiState !is OtpUiState.Verifying,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (uiState is OtpUiState.Verifying) {
                CircularProgressIndicator(modifier = Modifier.height(20.dp), strokeWidth = 2.dp)
            } else {
                Text(stringResource(R.string.otp_verify))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        if (resendSecondsLeft > 0) {
            Text(
                text = stringResource(R.string.otp_resend_in, resendSecondsLeft),
                style = MaterialTheme.typography.bodySmall,
            )
        } else {
            Text(
                text = stringResource(R.string.otp_resend),
                style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.primary),
                modifier = Modifier.clickable(enabled = uiState !is OtpUiState.Resending) {
                    viewModel.resendOtp(phone)
                    resendSecondsLeft = RESEND_COOLDOWN_SECONDS
                },
            )
        }

        val currentState = uiState
        if (currentState is OtpUiState.Error) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = currentState.message, color = MaterialTheme.colorScheme.error)
        }
    }
}
