package com.example.driversupport.ui.screens.driver

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import java.util.*

@Composable
fun DriverDashboardScreen(navController: NavController) {
    // ... existing dashboard code ...

    // Update the handleNewCase function to navigate directly to chat
    val handleNewCase = {
        // Generate a random case ID
        val caseId = "case-${UUID.randomUUID().toString().substring(0, 8)}"
        // Navigate directly to chat screen with the new case ID
        navController.navigate("driver/chat/${caseId}")
    }

    Scaffold(
        // ... existing scaffold code ...
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF1E1E1E)
            ) {
                NavigationBarItem(
                    selected = true,
                    onClick = { /* Already on dashboard */ },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = Color.White,
                        indicatorColor = Color(0xFF2A2A2A)
                    )
                )
                NavigationBarItem(
                    selected = false,
                    onClick = handleNewCase, // Direct to chat
                    icon = { Icon(Icons.Default.Add, contentDescription = "New Case") },
                    label = { Text("New Case") },
                    colors = NavigationBarItemDefaults.colors(
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    )
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { /* Navigate to profile */ },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile") },
                    colors = NavigationBarItemDefaults.colors(
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    )
                )
            }
        }
    ) { paddingValues ->
        // ... existing content ...
    }
}

