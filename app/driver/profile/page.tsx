"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, LogOut, LineChart, MessageSquarePlus, User } from "lucide-react"
import Link from "next/link"

export default function DriverProfile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login?role=driver")
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
        <div className="mb-6 flex items-center">
          <Link href="/driver/dashboard">
            <Button variant="ghost" size="icon" className="mr-2 text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Profile</h2>
            <p className="text-gray-400">Manage your account settings</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription className="text-gray-400">Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-400">Name</span>
                <span className="font-medium">{user?.name || "Driver Name"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-400">Email</span>
                <span className="font-medium">{user?.email || "driver@example.com"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-400">Driver ID</span>
                <span className="font-medium">{user?.id || "D12345"}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-400">Role</span>
                <Badge className="w-fit">{user?.role || "driver"}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription className="text-gray-400">Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-400">Notification Preferences</span>
                <span className="font-medium">Email and Push Notifications</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-400">Language</span>
                <span className="font-medium">English (US)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription className="text-gray-400">Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
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
            className="flex-1 flex flex-col items-center text-white"
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

