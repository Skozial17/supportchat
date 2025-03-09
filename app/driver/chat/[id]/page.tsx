"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

// Define message types
type Message = {
  id: string
  content: string
  sender: "system" | "user" | "admin"
  timestamp: Date
}

// Define conversation flows for different case types
const conversationFlows: Record<string, any> = {
  initial: {
    message: "What can we help you with?",
    options: [
      { id: "load_issue", text: "Load Issue", description: "Report problems with your current load" },
      { id: "app_problem", text: "App Problem", description: "Report technical issues with the app" },
      {
        id: "delivery_confirmation",
        text: "Delivery Confirmation",
        description: "Confirm or report issues with delivery",
      },
      { id: "route_issue", text: "Route Issue", description: "Report problems with your assigned route" },
      { id: "other_issue", text: "Other Issue", description: "Report any other problems" },
    ],
  },
  load_issue: {
    message: "What issue are you experiencing with your load?",
    options: [
      { id: "load_not_showing", text: "Load is not showing in my app" },
      { id: "load_cancelled_still_showing", text: "Load was cancelled but still showing" },
      { id: "wrong_load_details", text: "Wrong load details" },
      { id: "other_load_issue", text: "Other load issue" },
    ],
  },
  load_not_showing: {
    message: "Have you tried refreshing your app?",
    options: [
      { id: "yes_still_not_showing", text: "Yes, still not showing" },
      { id: "no_will_try", text: "No, I will try now" },
    ],
  },
  load_cancelled_still_showing: {
    message: "Please provide your VRID number:",
    requireInput: true,
    inputPlaceholder: "Enter VRID number",
  },
  app_problem: {
    message: "What app issue are you experiencing?",
    options: [
      { id: "app_not_loading", text: "App is not loading" },
      { id: "app_crashing", text: "App keeps crashing" },
      { id: "cannot_login", text: "Cannot log in" },
      { id: "other_technical_issue", text: "Other technical issue" },
    ],
  },
  delivery_confirmation: {
    message: "What do you need help with regarding delivery?",
    options: [
      { id: "cannot_mark_complete", text: "Cannot mark delivery as complete" },
      { id: "wrong_delivery_status", text: "Wrong delivery status" },
      { id: "missing_delivery_info", text: "Missing delivery information" },
      { id: "other_delivery_issue", text: "Other delivery issue" },
    ],
  },
  route_issue: {
    message: "What route issue are you experiencing?",
    options: [
      { id: "wrong_route", text: "Wrong route assigned" },
      { id: "route_not_optimal", text: "Route not optimal" },
      { id: "cannot_access_route", text: "Cannot access route details" },
      { id: "other_route_issue", text: "Other route issue" },
    ],
  },
  other_issue: {
    message: "Please select the type of issue:",
    options: [
      { id: "vehicle_issue", text: "Vehicle issue" },
      { id: "payment_issue", text: "Payment issue" },
      { id: "schedule_issue", text: "Schedule issue" },
      { id: "need_support", text: "Need to speak with support" },
    ],
  },
  yes_still_not_showing: {
    message: "We'll investigate this issue. Please provide your VRID number:",
    requireInput: true,
    inputPlaceholder: "Enter VRID number",
  },
  no_will_try: {
    message: "Please refresh your app and let us know if the issue persists.",
    options: [
      { id: "issue_resolved", text: "Issue resolved after refresh" },
      { id: "still_having_issue", text: "Still having the same issue" },
    ],
  },
}

export default function Chat() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [currentFlow, setCurrentFlow] = useState<string>("initial")
  const [inputValue, setInputValue] = useState("")
  const [requireInput, setRequireInput] = useState(false)
  const [inputPlaceholder, setInputPlaceholder] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat with welcome message and category options
  useEffect(() => {
    // Only initialize if no messages exist
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: "1",
        content: conversationFlows.initial.message,
        sender: "system",
        timestamp: new Date(),
      }
      setMessages([initialMessage])
      setCurrentFlow("initial")
    }
  }, [messages.length])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleOptionSelect = (optionId: string, optionText: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: optionText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Get next flow
    const nextFlow = conversationFlows[optionId]

    if (nextFlow) {
      setTimeout(() => {
        const systemMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: nextFlow.message,
          sender: "system",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, systemMessage])
        setCurrentFlow(optionId)
        setRequireInput(!!nextFlow.requireInput)
        setInputPlaceholder(nextFlow.inputPlaceholder || "")
      }, 500)
    } else {
      // Default response if no specific flow exists
      setTimeout(() => {
        const systemMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Thank you for providing that information. A support agent will review your case shortly.",
          sender: "system",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, systemMessage])
        setCurrentFlow("")
        setRequireInput(false)
      }, 500)
    }
  }

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setRequireInput(false)

    // Default response after input
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for providing that information. We'll investigate and get back to you shortly.",
        sender: "system",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, systemMessage])
      setCurrentFlow("")
    }, 500)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <Link href="/driver/dashboard">
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="ml-2 text-lg font-semibold text-white">Support Chat</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-white">
          <Settings className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === "user" ? "bg-green-600 text-white" : "bg-gray-800 text-white"
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">{formatTime(message.timestamp)}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 border-t border-gray-800">
        {requireInput ? (
          <div className="flex space-x-2">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="flex-1 bg-gray-800 border-gray-700 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInputSubmit()
                }
              }}
            />
            <Button
              onClick={handleInputSubmit}
              disabled={!inputValue.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              Send
            </Button>
          </div>
        ) : (
          currentFlow &&
          conversationFlows[currentFlow]?.options && (
            <div className="space-y-2">
              {conversationFlows[currentFlow].options.map((option: any) => (
                <Button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id, option.text)}
                  className="w-full bg-gray-800 hover:bg-gray-700 justify-start text-white text-left"
                >
                  <div className="flex flex-col items-start">
                    <span>{option.text}</span>
                    {option.description && <span className="text-xs text-gray-400">{option.description}</span>}
                  </div>
                </Button>
              ))}
            </div>
          )
        )}
      </footer>
    </div>
  )
}

