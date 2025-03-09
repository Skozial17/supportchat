"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user")
    if (user) {
      const parsedUser = JSON.parse(user)
      if (parsedUser.role === "driver") {
        router.push("/driver/dashboard")
      } else if (parsedUser.role === "admin") {
        router.push("/admin/dashboard")
      }
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Driver Support System</CardTitle>
          <CardDescription className="text-gray-400">Login to access the support system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Link href="/login?role=driver" className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                Driver Login
              </Button>
            </Link>
          </div>
          <div className="flex flex-col space-y-2">
            <Link href="/login?role=admin" className="w-full">
              <Button className="w-full bg-gray-800 hover:bg-gray-700" size="lg">
                Administrator Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

