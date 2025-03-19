"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, User, Bot } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import type { SupportCase } from "@/lib/auth"
import { updateCaseStatus, addCaseMessage } from "@/lib/auth"

// Define the message structure
type Message = {
  id: string
  text: string
  sender: "system" | "driver" | "admin"
  createdAt: Date
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
  const [supportCase, setSupportCase] = useState<SupportCase | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState<string>("start")
  const [inputValue, setInputValue] = useState<string>("")
  const [isWaitingForInput, setIsWaitingForInput] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

    loadCase()
    const unsubscribe = subscribeToMessages()
    return () => unsubscribe()
  }, [params.id])

  const loadCase = async () => {
    try {
      const caseRef = doc(db, "cases", params.id as string)
      const caseSnap = await getDoc(caseRef)
      
      if (caseSnap.exists()) {
        const caseData = {
          id: caseSnap.id,
          ...caseSnap.data(),
          createdAt: caseSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: caseSnap.data().updatedAt?.toDate() || new Date()
        } as SupportCase
        setSupportCase(caseData)
      }
    } catch (error) {
      console.error("Error loading case:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const messagesRef = collection(db, "cases", params.id as string, "messages")
    const q = query(messagesRef, orderBy("createdAt", "asc"))

    return onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Message[]
      setMessages(newMessages)
      scrollToBottom()
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: option,
      sender: "driver",
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Get next step
    const nextStepId =
      conversationFlow[currentStep].nextStep?.[option] || conversationFlow[currentStep].defaultNextStep || "start"

    // Add system response
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: conversationFlow[nextStepId].message,
        sender: "system",
        createdAt: new Date(),
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
      text: inputValue,
      sender: "driver",
      createdAt: new Date(),
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
        text: conversationFlow[nextStepId].message,
        sender: "system",
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, systemMessage])
      setCurrentStep(nextStepId)
    }, 500)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !supportCase) return

    try {
      await addCaseMessage(supportCase.id, {
        text: newMessage,
        sender: "driver"
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleStatusChange = async (newStatus: "open" | "closed") => {
    if (!supportCase) return
    try {
      const result = await updateCaseStatus(supportCase.id, newStatus)
      if (result.success) {
        setSupportCase(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error("Error updating case status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  if (!supportCase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Case not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto max-w-4xl p-4">
        <header className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <Link href="/driver/dashboard" className="inline-flex items-center text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
              <div className="text-center flex-1">
                <h1 className="text-white text-lg font-semibold">{supportCase.title}</h1>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Badge variant={supportCase.status === "open" ? "destructive" : "secondary"}>
                    {supportCase.status}
                  </Badge>
                  {supportCase.status === "closed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange("open")}
                      className="text-green-500 border-green-500 hover:bg-green-500/10"
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
              <div className="w-16"></div>
            </div>
          </div>
        </header>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="space-y-4 h-[600px] overflow-y-auto mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "driver" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.sender === "driver"
                        ? "bg-primary text-primary-foreground"
                        : message.sender === "system"
                        ? "bg-gray-800 text-gray-300"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {supportCase.status === "open" && (
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                />
                <Button type="submit" className="bg-primary text-white">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

