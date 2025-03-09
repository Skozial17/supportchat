package com.example.driversupport.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.driversupport.ui.screens.LoginScreen
import com.example.driversupport.ui.screens.SplashScreen
import com.example.driversupport.ui.screens.driver.DriverDashboardScreen
import com.example.driversupport.ui.screens.driver.ChatScreen
import com.example.driversupport.ui.screens.admin.AdminDashboardScreen
import com.example.driversupport.ui.screens.admin.CaseDetailScreen

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(navController = navController)
        }
        
        composable(Screen.Login.route) {
            LoginScreen(navController = navController)
        }
        
        // Driver screens
        composable(Screen.DriverDashboard.route) {
            DriverDashboardScreen(navController = navController)
        }
        
        // Chat screen - now directly accessible from dashboard
        composable(
            route = Screen.Chat.route + "/{caseId}",
            arguments = listOf(
                navArgument("caseId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val caseId = backStackEntry.arguments?.getString("caseId") ?: ""
            ChatScreen(
                navController = navController,
                caseId = caseId
            )
        }
        
        // Admin screens
        composable(Screen.AdminDashboard.route) {
            AdminDashboardScreen(navController = navController)
        }
        
        composable(
            route = Screen.CaseDetail.route + "/{caseId}",
            arguments = listOf(
                navArgument("caseId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val caseId = backStackEntry.arguments?.getString("caseId") ?: ""
            CaseDetailScreen(
                navController = navController,
                caseId = caseId
            )
        }
    }
}

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object DriverDashboard : Screen("driver/dashboard")
    object Chat : Screen("driver/chat")
    object AdminDashboard : Screen("admin/dashboard")
    object CaseDetail : Screen("admin/case")
}

