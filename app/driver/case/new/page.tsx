"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createSupportCase, addCaseMessage } from "@/lib/auth"
import { Send } from "lucide-react"

type Message = {
  id: string
  content: string
  sender: "system" | "user" | "admin"
  timestamp: string
  options?: string[]
}

type ConversationStep = {
  message: string
  options?: string[]
  nextStep?: Record<string, string>
}

const conversationFlow: Record<string, ConversationStep> = {
  start: {
    message: "Has the tour started?",
    options: ["Yes", "No"],
    nextStep: {
      Yes: "issue_type",
      No: "tour_not_started"
    }
  },
  tour_not_started: {
    message: "Please start your tour and check back when ready."
  },
  issue_type: {
    message: "What type of issue are you experiencing?",
    options: ["Load Issue"],
    nextStep: {
      "Load Issue": "load_issue_type"
    }
  },
  load_issue_type: {
    message: "What load issue are you experiencing?",
    options: [
      "Load has disappeared from Amazon Relay",
      "I was told load is cancelled but it still showing on my app"
    ],
    nextStep: {
      "Load has disappeared from Amazon Relay": "vrid_input",
      "I was told load is cancelled but it still showing on my app": "vrid_input"
    }
  },
  vrid_input: {
    message: "Please type VRID affected:"
  }
}

export default function NewCase() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState("start")
  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [caseTitle, setCaseTitle] = useState("New Support Case")
  const [caseId, setCaseId] = useState("")

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
    // Add initial system message
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    setMessages([{
      id: "1",
      content: conversationFlow.start.message,
      sender: "system",
      timestamp,
      options: conversationFlow.start.options
    }])
  }, [router])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleOptionSelect = async (option: string) => {
    if (isSubmitting) return

    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    // Add user's response to messages
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: option,
      sender: "user",
      timestamp
    }])

    if (option === "Load has disappeared from Amazon Relay" || 
        option === "I was told load is cancelled but it still showing on my app") {
      setSelectedIssue(option)
      setCaseTitle(`Load Issue - ${option}`)
    }

    const currentFlow = conversationFlow[currentStep]
    
    // If there's a next step defined for this option
    if (currentFlow.nextStep?.[option]) {
      const nextStep = currentFlow.nextStep[option]
      const nextFlow = conversationFlow[nextStep]
      
      setCurrentStep(nextStep)

      // Add system's next message after a short delay
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: nextFlow.message,
          sender: "system",
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          options: nextFlow.options
        }])
      }, 500)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isSubmitting) return

    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    // Add user's message
    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue("")

    // If we're at the VRID input step
    if (currentStep === "vrid_input") {
      setIsSubmitting(true)
      try {
        const result = await createSupportCase({
          driverId: user.uid,
          driverName: user.name || user.email.split('@')[0],
          driverEmail: user.email,
          company: "KozialTrans",
          title: caseTitle,
          description: `Tour started: Yes\nIssue type: Load Issue\nSpecific issue: ${selectedIssue}\nVRID: ${inputValue}`,
          status: "open"
        })

        if (result.success) {
          setCaseId(result.caseId)
          // Add all messages to the case
          for (const msg of messages) {
            await addCaseMessage(result.caseId, {
              text: msg.content,
              sender: msg.sender === "system" ? "admin" : "driver"
            })
          }
          // Add the final VRID message
          await addCaseMessage(result.caseId, {
            text: inputValue,
            sender: "driver"
          })
          
          router.push(`/driver/dashboard`)
        }
      } catch (error) {
        console.error("Error creating case:", error)
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Failed to create support case. Please try again.",
          sender: "system",
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        }])
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/driver/dashboard" className="inline-flex items-center text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-white text-lg font-semibold">{caseTitle}</h1>
              {caseId && (
                <p className="text-sm text-gray-400">Case #{caseId}</p>
              )}
            </div>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-900 text-white"
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                {message.options && message.sender === "system" && (
                  <div className="mt-4 space-y-2">
                    {message.options.map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className="w-full justify-start text-left bg-gray-800 border-gray-700 hover:bg-gray-700"
                        onClick={() => handleOptionSelect(option)}
                        disabled={isSubmitting}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 p-4">
        <div className="container mx-auto max-w-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white"
              disabled={isSubmitting || currentStep !== "vrid_input"}
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || !inputValue.trim() || currentStep !== "vrid_input"}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </footer>
    </div>
  )
} 