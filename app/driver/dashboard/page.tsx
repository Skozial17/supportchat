"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquarePlus, LineChart, User } from "lucide-react"
import Link from "next/link"

// Define the case structure
type Case = {
  id: string
  title: string
  lastMessage: string
  status: "open" | "closed"
  createdAt: Date
  updatedAt: Date
}

export default function DriverDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

    // Mock API call to get cases
    setTimeout(() => {
      const mockCases: Case[] = [
        {
          id: "case-001",
          title: "Load Issue",
          lastMessage: "Please type VRID affected",
          status: "open",
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 1800000),
        },
        {
          id: "case-002",
          title: "App Navigation",
          lastMessage: "Thank you for your report. Our team is investigating.",
          status: "open",
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 43200000),
        },
        {
          id: "case-003",
          title: "Delivery Confirmation",
          lastMessage: "Your delivery has been confirmed. Thank you!",
          status: "closed",
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 86400000),
        },
      ]

      setCases(mockCases)
      setIsLoading(false)
    }, 1000)
  }, [router])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Generate a new case ID and navigate directly to chat
  const handleNewCase = () => {
    const caseId = `case-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`
    router.push(`/driver/chat/${caseId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Support Cases</h2>
          <p className="text-gray-400">View and manage your support requests</p>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="mb-4 bg-gray-900">
            <TabsTrigger value="open" className="text-gray-300 data-[state=active]:bg-gray-800">
              Open
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-gray-300 data-[state=active]:bg-gray-800">
              Closed
            </TabsTrigger>
            <TabsTrigger value="all" className="text-gray-300 data-[state=active]:bg-gray-800">
              All
            </TabsTrigger>
          </TabsList>

          {["open", "closed", "all"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {cases
                .filter((c) => tabValue === "all" || c.status === tabValue)
                .map((supportCase) => (
                  <Link key={supportCase.id} href={`/driver/chat/${supportCase.id}`}>
                    <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-white">{supportCase.title}</h3>
                          <p className="text-sm text-gray-400">{supportCase.lastMessage}</p>
                        </div>
                        <Badge variant={supportCase.status === "open" ? "default" : "secondary"}>
                          {supportCase.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">Last updated: {formatDate(supportCase.updatedAt)}</div>
                    </Card>
                  </Link>
                ))}

              {cases.filter((c) => tabValue === "all" || c.status === tabValue).length === 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <div className="p-6 text-center text-gray-400">No {tabValue} cases found.</div>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-2">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            className="flex-1 flex flex-col items-center text-gray-400 hover:text-white"
            onClick={() => router.push("/driver/dashboard")}
          >
            <LineChart className="h-5 w-5" />
            <span className="text-xs mt-1">Cases</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 flex flex-col items-center text-gray-400 hover:text-white"
            onClick={handleNewCase}
          >
            <MessageSquarePlus className="h-5 w-5" />
            <span className="text-xs mt-1">New Case</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 flex flex-col items-center text-gray-400 hover:text-white"
            onClick={() => router.push("/driver/profile")}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

