"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, User, Bot } from "lucide-react"
import Link from "next/link"

// Define the message structure
type Message = {
  id: string
  content: string
  sender: "system" | "user"
  timestamp: Date
}

// Define the conversation flow steps
type ConversationStep = {
  id: string
  message: string
  options?: string[]
  requiresInput?: boolean
  inputPlaceholder?: string
  nextStep?: Record<string, string>
  defaultNextStep?: string
}

// Define the conversation flow
const conversationFlow: Record<string, ConversationStep> = {
  start: {
    id: "start",
    message: "Has the tour started?",
    options: ["Yes", "No"],
    nextStep: {
      Yes: "load_showing",
      No: "tour_not_started",
    },
  },
  tour_not_started: {
    id: "tour_not_started",
    message: "Please start your tour and check back when ready.",
    defaultNextStep: "start",
  },
  load_showing: {
    id: "load_showing",
    message: "Thank you. Is the load still showing on your app?",
    options: ["Yes", "No", "Site told me load is cancelled but it is still on my Relay app"],
    nextStep: {
      Yes: "load_showing_yes",
      No: "load_showing_no",
      "Site told me load is cancelled but it is still on my Relay app": "vrid_request",
    },
  },
  load_showing_yes: {
    id: "load_showing_yes",
    message: "Please proceed with the delivery as shown in your app.",
    defaultNextStep: "start",
  },
  load_showing_no: {
    id: "load_showing_no",
    message: "Thank you for confirming. No further action is needed.",
    defaultNextStep: "start",
  },
  vrid_request: {
    id: "vrid_request",
    message: "Please type VRID affected:",
    requiresInput: true,
    inputPlaceholder: "Enter VRID number",
    defaultNextStep: "vrid_confirmation",
  },
  vrid_confirmation: {
    id: "vrid_confirmation",
    message: "Thank you for providing the VRID. We will investigate the issue and update your app shortly.",
    defaultNextStep: "start",
  },
}

export default function CaseDetail() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [caseDetails, setCaseDetails] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState<string>("start")
  const [inputValue, setInputValue] = useState<string>("")
  const [isWaitingForInput, setIsWaitingForInput] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login?role=driver")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    if (parsedUser.role !== "driver") {
      router.push("/login?role=driver")
      return
    }

    setUser(parsedUser)

    // Mock API call to get case details and messages
    setTimeout(() => {
      // Mock case details
      const mockCase = {
        id: caseId,
        title: caseId === "case-001" ? "Load not showing correctly" : `Support Case #${caseId.split("-")[1]}`,
        status: "open",
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 1800000),
      }

      setCaseDetails(mockCase)

      // Initial system message
      const initialMessages: Message[] = [
        {
          id: "1",
          content: conversationFlow.start.message,
          sender: "system",
          timestamp: new Date(Date.now() - 3600000),
        },
      ]

      setMessages(initialMessages)
      setIsLoading(false)
    }, 1000)
  }, [caseId, router])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: option,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Get next step
    const nextStepId =
      conversationFlow[currentStep].nextStep?.[option] || conversationFlow[currentStep].defaultNextStep || "start"

    // Add system response
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: conversationFlow[nextStepId].message,
        sender: "system",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, systemMessage])
      setCurrentStep(nextStepId)

      // Check if the next step requires input
      setIsWaitingForInput(!!conversationFlow[nextStepId].requiresInput)
    }, 500)
  }

  // Handle custom input submission
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
    setIsWaitingForInput(false)

    // Get next step
    const nextStepId = conversationFlow[currentStep].defaultNextStep || "start"

    // Add system response
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: conversationFlow[nextStepId].message,
        sender: "system",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, systemMessage])
      setCurrentStep(nextStepId)
    }, 500)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4 shadow-sm">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/driver/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="ml-2">
                <h1 className="text-lg font-bold">{caseDetails?.title}</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{caseId}</Badge>
                  <Badge variant={caseDetails?.status === "open" ? "default" : "secondary"}>
                    {caseDetails?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-4xl p-4 flex flex-col">
        <Card className="flex-grow flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-center text-sm">Support Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                      message.sender === "user" ? "bg-primary text-primary-foreground ml-2" : "bg-gray-200"
                    }`}
                  >
                    {message.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-gray-200 rounded-tl-none"
                      }`}
                    >
                      {message.content}
                    </div>
                    <div
                      className={`text-xs text-muted-foreground mt-1 ${
                        message.sender === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="border-t p-4">
            {!isWaitingForInput && conversationFlow[currentStep].options ? (
              <div className="w-full space-y-2">
                {conversationFlow[currentStep].options?.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex w-full space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={conversationFlow[currentStep].inputPlaceholder || "Type your message..."}
                  className="flex-grow"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleInputSubmit()
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={handleInputSubmit} disabled={!inputValue.trim()}>
                  <Send size={18} />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}

