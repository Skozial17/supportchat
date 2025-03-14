"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createSupportCase, addCaseMessage } from "@/lib/auth"

type Message = {
  id: string
  content: string
  sender: "system" | "user"
  options?: string[]
  requireInput?: boolean
}

type ConversationStep = {
  message: string
  options?: string[]
  nextStep?: Record<string, string>
  requireInput?: boolean
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
    message: "Please type VRID affected:",
    requireInput: true
  }
}

export default function NewCase() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState("start")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedIssue, setSelectedIssue] = useState("")
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
    // Add initial system message
    setMessages([{
      id: "1",
      content: conversationFlow.start.message,
      sender: "system",
      options: conversationFlow.start.options
    }])
  }, [router])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleOptionSelect = async (option: string) => {
    if (isSubmitting) return

    // Add user's response to messages
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: option,
      sender: "user"
    }])

    if (option === "Load has disappeared from Amazon Relay" || 
        option === "I was told load is cancelled but it still showing on my app") {
      setSelectedIssue(option)
    }

    const currentFlow = conversationFlow[currentStep]
    
    // If there's a next step defined for this option
    if (currentFlow.nextStep?.[option]) {
      const nextStep = currentFlow.nextStep[option]
      const nextFlow = conversationFlow[nextStep]
      
      setCurrentStep(nextStep)
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "1",
        content: nextFlow.message,
        sender: "system",
        options: nextFlow.options,
        requireInput: nextFlow.requireInput
      }])
    }
  }

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isSubmitting) return

    // Add user's VRID input to messages
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user"
    }])

    // Add the "please wait" message
    setMessages(prev => [...prev, {
      id: Date.now().toString() + "1",
      content: "Please wait whilst we raise case to ROC",
      sender: "system"
    }])

    // Create the support case
    setIsSubmitting(true)
    try {
      const result = await createSupportCase({
        driverId: user.uid,
        driverName: user.name || user.email.split('@')[0],
        driverEmail: user.email,
        company: "KozialTrans",
        title: `Load Issue - ${selectedIssue}`,
        description: `Tour started: Yes\nIssue type: Load Issue\nSpecific issue: ${selectedIssue}\nVRID: ${inputValue}`,
        status: "open"
      })

      if (result.success) {
        // Store all conversation messages
        const conversationMessages = [
          {
            text: "Has the tour started?",
            sender: "system"
          },
          {
            text: "Yes",
            sender: "driver"
          },
          {
            text: "What type of issue are you experiencing?",
            sender: "system"
          },
          {
            text: "Load Issue",
            sender: "driver"
          },
          {
            text: "What load issue are you experiencing?",
            sender: "system"
          },
          {
            text: selectedIssue,
            sender: "driver"
          },
          {
            text: "Please type VRID affected:",
            sender: "system"
          },
          {
            text: inputValue,
            sender: "driver"
          }
        ]

        // Add each message to the case
        for (const msg of conversationMessages) {
          await addCaseMessage(result.caseId, msg)
        }

        router.push(`/driver/dashboard`)
      }
    } catch (error) {
      console.error("Error creating case:", error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Failed to create support case. Please try again.",
        sender: "system"
      }])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="container mx-auto">
          <Link href="/driver/dashboard" className="inline-flex items-center text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className={`${
                message.sender === "system" 
                  ? "bg-gray-900 border-gray-800" 
                  : "bg-primary border-primary/50 ml-8"
              }`}
            >
              <CardContent className="p-4">
                <p className={`${
                  message.sender === "system" ? "text-white" : "text-primary-foreground"
                }`}>
                  {message.content}
                </p>
                {message.options && (
                  <div className="mt-4 space-y-2">
                    {message.options.map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className="w-full justify-start text-left"
                        onClick={() => handleOptionSelect(option)}
                        disabled={isSubmitting}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
                {message.requireInput && message.sender === "system" && (
                  <form onSubmit={handleInputSubmit} className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter VRID"
                        className="bg-gray-800 border-gray-700 text-white"
                        disabled={isSubmitting}
                      />
                      <Button 
                        type="submit"
                        disabled={isSubmitting || !inputValue.trim()}
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  )
} 