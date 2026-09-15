package com.busgo.app.ui.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.busgo.app.R

/**
 * Home shell. The search card, recent searches, popular routes and
 * recommended buses sections are wired to the search/cities modules
 * once those backend endpoints exist (Phase 2/3).
 */
@Composable
fun HomeScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Text(text = stringResource(R.string.home_search_buses), style = MaterialTheme.typography.headlineMedium)
    }
}
