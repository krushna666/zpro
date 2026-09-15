package com.busgo.app.core.network

import com.busgo.app.data.local.datastore.SessionDataStore
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import javax.inject.Inject

/**
 * Handles 401 responses. The refresh-token exchange itself is wired up alongside
 * the auth module (POST /auth/refresh); until then, an expired session is cleared
 * so navigation routes the user back to login rather than looping on 401s.
 */
class TokenAuthenticator @Inject constructor(
    private val sessionDataStore: SessionDataStore,
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null
        runBlocking { sessionDataStore.clearSession() }
        return null
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
