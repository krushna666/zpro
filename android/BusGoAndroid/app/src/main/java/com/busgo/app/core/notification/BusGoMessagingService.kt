package com.busgo.app.core.notification

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Receives FCM pushes (OTP, booking/payment/trip/cancellation/refund updates,
 * promotions) and a refreshed registration token. Device-token registration
 * against POST /users/me/device-tokens and notification-channel routing are
 * wired up alongside the notifications backend module.
 */
class BusGoMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
    }
}
