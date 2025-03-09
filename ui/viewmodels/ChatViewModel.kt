package com.example.driversupport.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.driversupport.data.model.Message
import com.example.driversupport.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages

    private val _currentOptions = MutableStateFlow<List<String>>(emptyList())
    val currentOptions: StateFlow<List<String>> = _currentOptions

    private val _requireInput = MutableStateFlow(false)
    val requireInput: StateFlow<Boolean> = _requireInput

    private val _inputPlaceholder = MutableStateFlow("")
    val inputPlaceholder: StateFlow<String> = _inputPlaceholder

    fun initializeChat(initialMessage: String, initialOptions: List<String>) {
        // Only initialize if not already initialized
        if (_messages.value.isEmpty()) {
            // Add initial system message
            val message = Message(
                id = UUID.randomUUID().toString(),
                content = initialMessage,
                sender = "system",
                timestamp = Date()
            )
            _messages.value = listOf(message)
            _currentOptions.value = initialOptions
            _requireInput.value = false
        }
    }

    fun selectOption(option: String) {
        // Add user selection as message
        val userMessage = Message(
            id = UUID.randomUUID().toString(),
            content = option,
            sender = "user",
            timestamp = Date()
        )
        _messages.value = _messages.value + userMessage

        // Get next step based on selection
        viewModelScope.launch {
            val nextStep = chatRepository.getNextStep(option)
            delay(500) // Simulate network delay

            // Add system response
            val systemMessage = Message(
                id = UUID.randomUUID().toString(),
                content = nextStep.message,
                sender = "system",
                timestamp = Date()
            )
            _messages.value = _messages.value + systemMessage

            // Update options or input requirement
            _currentOptions.value = nextStep.options
            _requireInput.value = nextStep.requireInput
            _inputPlaceholder.value = nextStep.inputPlaceholder ?: ""
        }
    }

    fun sendUserInput(input: String) {
        // Add user message
        val userMessage = Message(
            id = UUID.randomUUID().toString(),
            content = input,
            sender = "user",
            timestamp = Date()
        )
        
        _messages.value = _messages.value + userMessage
        
        // Default response after input
        viewModelScope.launch {
            delay(500) // Simulate network delay
            
            val systemMessage = Message(
                id = UUID.randomUUID().toString(),
                content = "Thank you for providing that information. We'll investigate and get back to you shortly.",
                sender = "system",
                timestamp = Date()
            )
            
            _messages.value = _messages.value + systemMessage
            _currentOptions.value = emptyList()
            _requireInput.value = false
        }
    }
}

