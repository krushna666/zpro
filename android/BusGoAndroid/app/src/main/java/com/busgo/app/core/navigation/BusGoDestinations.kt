package com.busgo.app.core.navigation

/**
 * Route constants for the navigation graph. Only IDs/primitives are ever passed
 * as navigation arguments — screens load full objects from their repository.
 */
object BusGoDestinations {
    const val SPLASH = "splash"
    const val ONBOARDING = "onboarding"
    const val LOGIN = "login"
    const val OTP = "otp/{phone}"
    const val HOME = "home"
    const val SEARCH = "search"
    const val BUS_DETAILS = "bus-details/{tripId}"
    const val SEAT_SELECTION = "seat-selection/{tripId}"
    const val BOARDING_SELECTION = "boarding-selection/{tripId}"
    const val DROPPING_SELECTION = "dropping-selection/{tripId}"
    const val PASSENGER_DETAILS = "passenger-details/{bookingId}"
    const val CHECKOUT = "checkout/{bookingId}"
    const val PAYMENT = "payment/{bookingId}"
    const val BOOKING_SUCCESS = "booking-success/{bookingId}"
    const val TICKET = "ticket/{bookingId}"
    const val BOOKINGS = "bookings"
    const val BOOKING_DETAILS = "booking-details/{bookingId}"
    const val PROFILE = "profile"
    const val SETTINGS = "settings"
    const val SUPPORT = "support"

    fun otp(phone: String) = "otp/$phone"
    fun busDetails(tripId: String) = "bus-details/$tripId"
}
