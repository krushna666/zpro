package com.busgo.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.busgo.app.ui.auth.LoginScreen
import com.busgo.app.ui.auth.OtpScreen
import com.busgo.app.ui.home.HomeScreen
import com.busgo.app.ui.onboarding.OnboardingScreen
import com.busgo.app.ui.splash.SplashScreen

@Composable
fun BusGoNavHost(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = BusGoDestinations.SPLASH) {
        composable(BusGoDestinations.SPLASH) {
            SplashScreen(
                onNavigateToHome = {
                    navController.navigate(BusGoDestinations.HOME) {
                        popUpTo(BusGoDestinations.SPLASH) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate(BusGoDestinations.ONBOARDING) {
                        popUpTo(BusGoDestinations.SPLASH) { inclusive = true }
                    }
                },
            )
        }
        composable(BusGoDestinations.ONBOARDING) {
            OnboardingScreen(
                onFinished = {
                    navController.navigate(BusGoDestinations.LOGIN) {
                        popUpTo(BusGoDestinations.ONBOARDING) { inclusive = true }
                    }
                },
            )
        }
        composable(BusGoDestinations.LOGIN) {
            LoginScreen(
                onOtpSent = { phone -> navController.navigate(BusGoDestinations.otp(phone)) },
            )
        }
        composable(
            route = BusGoDestinations.OTP,
            arguments = listOf(navArgument("phone") { type = NavType.StringType }),
        ) { backStackEntry ->
            val phone = backStackEntry.arguments?.getString("phone").orEmpty()
            OtpScreen(
                phone = phone,
                onVerified = {
                    navController.navigate(BusGoDestinations.HOME) {
                        popUpTo(BusGoDestinations.SPLASH) { inclusive = true }
                    }
                },
            )
        }
        composable(BusGoDestinations.HOME) {
            HomeScreen()
        }
    }
}
