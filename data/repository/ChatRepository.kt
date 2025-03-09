package com.example.driversupport.data.repository

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor() {
    
    data class ChatStep(
        val message: String,
        val options: List<String> = emptyList(),
        val requireInput: Boolean = false,
        val inputPlaceholder: String? = null
    )

    fun getNextStep(selectedOption: String): ChatStep {
        return when (selectedOption) {
            "Load Issue" -> ChatStep(
                message = "What issue are you experiencing with your load?",
                options = listOf(
                    "Load is not showing in my app",
                    "Load was cancelled but still showing",
                    "Wrong load details",
                    "Other load issue"
                )
            )
            "Load is not showing in my app" -> ChatStep(
                message = "Have you tried refreshing your app?",
                options = listOf(
                    "Yes, still not showing",
                    "No, I will try now"
                )
            )
            "Load was cancelled but still showing" -> ChatStep(
                message = "Please provide your VRID number:",
                requireInput = true,
                inputPlaceholder = "Enter VRID number"
            )
            "App Problem" -> ChatStep(
                message = "What app issue are you experiencing?",
                options = listOf(
                    "App is not loading",
                    "App keeps crashing",
                    "Cannot log in",
                    "Other technical issue"
                )
            )
            "Delivery Confirmation" -> ChatStep(
                message = "What do you need help with regarding delivery?",
                options = listOf(
                    "Cannot mark delivery as complete",
                    "Wrong delivery status",
                    "Missing delivery information",
                    "Other delivery issue"
                )
            )
            "Route Issue" -> ChatStep(
                message = "What route issue are you experiencing?",
                options = listOf(
                    "Wrong route assigned",
                    "Route not optimal",
                    "Cannot access route details",
                    "Other route issue"
                )
            )
            "Other Issue" -> ChatStep(
                message = "Please select the type of issue:",
                options = listOf(
                    "Vehicle issue",
                    "Payment issue",
                    "Schedule issue",
                    "Need to speak with support"
                )
            )
            // Add more specific responses for sub-options
            "Yes, still not showing" -> ChatStep(
                message = "We'll investigate this issue. Please provide your VRID number:",
                requireInput = true,
                inputPlaceholder = "Enter VRID number"
            )
            "No, I will try now" -> ChatStep(
                message = "Please refresh your app and let us know if the issue persists.",
                options = listOf(
                    "Issue resolved after refresh",
                    "Still having the same issue"
                )
            )
            else -> ChatStep(
                message = "Thank you for providing that information. A support agent will review your case shortly."
            )
        }
    }
}

