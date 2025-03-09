"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, User, Bot, CheckCircle } from "lucide-react"
import Link from "next/link"

// Define the message structure
type Message = {
  id: string
  content: string
  sender: "system" | "user" | "admin"
  timestamp: Date
}

// Define the case structure
type Case = {
  id: string
  driverId: string
  driverName: string
  title: string
  status: "open" | "closed"
  createdAt: Date
  updatedAt: Date
}

export default function AdminCaseDetail() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [caseDetails, setCaseDetails] = useState<Case | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login?role=admin")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    if (parsedUser.role !== "admin") {
      router.push("/login?role=admin")
      return
    }

    setUser(parsedUser)

    // Mock API call to get case details and messages
    setTimeout(() => {
      // Mock case details
      const mockCase: Case = {
        id: caseId,
        driverId: "D12345",
        driverName: "John Driver",
        title: caseId === "case-001" ? "Load not showing correctly" : `Support Case #${caseId.split("-")[1]}`,
        status: "open",
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 1800000),
      }

      setCaseDetails(mockCase)

      // Mock messages
      const mockMessages: Message[] = [
        {
          id: "1",
          content: "Has the tour started?",
          sender: "system",
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "2",
          content: "Yes",
          sender: "user",
          timestamp: new Date(Date.now() - 3500000),
        },
        {
          id: "3",
          content: "Thank you. Is the load still showing on your app?",
          sender: "system",
          timestamp: new Date(Date.now() - 3400000),
        },
        {
          id: "4",
          content: "Site told me load is cancelled but it is still on my Relay app",
          sender: "user",
          timestamp: new Date(Date.now() - 3300000),
        },
        {
          id: "5",
          content: "Please type VRID affected:",
          sender: "system",
          timestamp: new Date(Date.now() - 3200000),
        },
        {
          id: "6",
          content: "113456789",
          sender: "user",
          timestamp: new Date(Date.now() - 3100000),
        },
        {
          id: "7",
          content: "Thank you for providing the VRID. We will investigate the issue and update your app shortly.",
          sender: "system",
          timestamp: new Date(Date.now() - 3000000),
        },
      ]

      setMessages(mockMessages)
      setIsLoading(false)
    }, 1000)
  }, [caseId, router])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add admin message
    const adminMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "admin",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, adminMessage])
    setInputValue("")
  }

  const handleStatusChange = (value: string) => {
    if (!caseDetails) return

    setCaseDetails({
      ...caseDetails,
      status: value as "open" | "closed",
    })
  }

  const handlePriorityChange = (value: string) => {
    if (!caseDetails) return

    setCaseDetails({
      ...caseDetails,
      priority: value as "low" | "medium" | "high",
    })
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case "user":
        return <User size={16} />
      case "system":
        return <Bot size={16} />
      case "admin":
        return <User size={16} />
      default:
        return <User size={16} />
    }
  }

  const getSenderName = (sender: string) => {
    switch (sender) {
      case "user":
        return caseDetails?.driverName || "Driver"
      case "system":
        return "System Bot"
      case "admin":
        return user?.name || "Admin"
      default:
        return "Unknown"
    }
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
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="ml-2">
                <h1 className="text-lg font-bold">{caseDetails?.title}</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{caseId}</Badge>
                  <Badge variant="outline">
                    {caseDetails?.driverName} ({caseDetails?.driverId})
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Status:</span>
                <Select value={caseDetails?.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-6xl p-4 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          <div className="md:col-span-2 flex flex-col">
            <Card className="flex-grow flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-center text-sm">Conversation History</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col">
                    <div
                      className={`flex ${message.sender === "user" ? "justify-start" : message.sender === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex items-start max-w-[80%] ${message.sender === "admin" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                            message.sender === "admin"
                              ? "bg-primary text-primary-foreground ml-2"
                              : message.sender === "user"
                                ? "bg-secondary"
                                : "bg-gray-200"
                          }`}
                        >
                          {getSenderIcon(message.sender)}
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{getSenderName(message.sender)}</div>
                          <div
                            className={`p-3 rounded-lg ${
                              message.sender === "admin"
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : message.sender === "user"
                                  ? "bg-secondary rounded-tl-none"
                                  : "bg-gray-200 rounded-tl-none"
                            }`}
                          >
                            {message.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{formatTime(message.timestamp)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="border-t p-4">
                <div className="flex w-full space-x-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleSendMessage} disabled={!inputValue.trim()}>
                    <Send size={18} className="mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Driver Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium">Name</div>
                  <div>{caseDetails?.driverName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">ID</div>
                  <div>{caseDetails?.driverId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Contact</div>
                  <div>+1 (555) 123-4567</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div>driver@example.com</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div>{caseDetails?.createdAt.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Last Updated</div>
                  <div>{caseDetails?.updatedAt.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">VRID</div>
                  <div>113456789</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Category</div>
                  <div>Load Issue</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setInputValue(
                      "I've checked your VRID and confirmed the load has been cancelled. Please refresh your app in 5 minutes.",
                    )
                  }}
                >
                  Confirm Load Cancellation
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setInputValue("Could you please provide more details about the issue you're experiencing?")
                  }}
                >
                  Request More Info
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setInputValue(
                      "I've escalated this issue to our technical team. They will fix it within the next hour.",
                    )
                  }}
                >
                  Escalate to Tech Team
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setInputValue("This issue has been resolved. Is there anything else you need help with?")
                  }}
                >
                  Mark as Resolved
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

