package com.busgo.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.busgo.app.core.navigation.BusGoNavHost
import com.busgo.app.core.theme.BusGoTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setTheme(R.style.Theme_BusGo)
        enableEdgeToEdge()
        setContent {
            BusGoTheme {
                BusGoNavHost()
            }
        }
    }
}
