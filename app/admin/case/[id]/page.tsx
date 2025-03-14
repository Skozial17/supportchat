"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import type { SupportCase } from "@/lib/auth"

type Message = {
  id: string
  text: string
  sender: "system" | "driver" | "admin"
  createdAt: Date
}

export default function CaseView() {
  const router = useRouter()
  const params = useParams()
  const [supportCase, setSupportCase] = useState<SupportCase | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

    loadCase()
    subscribeToMessages()
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !supportCase) return

    try {
      await addCaseMessage(supportCase.id, {
        text: newMessage,
        sender: "admin"
      })

      // Update case timestamp
      const caseRef = doc(db, "cases", supportCase.id)
      await updateDoc(caseRef, {
        updatedAt: serverTimestamp()
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
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
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-gray-800"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">{supportCase.title}</h1>
              <p className="text-sm text-gray-400">
                {supportCase.driverName} • {supportCase.driverEmail}
              </p>
            </div>
          </div>
          <Badge variant={supportCase.status === "open" ? "destructive" : "secondary"}>
            {supportCase.status}
          </Badge>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="space-y-4 h-[600px] overflow-y-auto mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "admin" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.sender === "admin"
                        ? "bg-primary text-primary-foreground"
                        : message.sender === "system"
                        ? "bg-gray-800 text-gray-300"
                        : message.sender === "driver"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-600 text-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">
                        {message.sender === "driver" ? supportCase.driverName : message.sender}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{message.text}</p>
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

