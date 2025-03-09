package com.example.driversupport.data.model

import java.util.Date

data class Message(
    val id: String,
    val content: String,
    val sender: String, // "system", "user", or "admin"
    val timestamp: Date
)

