"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
          <CardDescription className="text-gray-400">Welcome to our driver portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white text-center">For Drivers</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/login?role=driver" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                  Driver Login
                </Button>
              </Link>
              <Link href="/signup/driver" className="w-full">
                <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10" size="lg">
                  Sign Up as Driver
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-500">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white text-center">For Administrators</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/login?role=admin" className="w-full">
                <Button className="w-full bg-gray-800 hover:bg-gray-700" size="lg">
                  Administrator Login
                </Button>
              </Link>
              <Link href="/admin/setup" className="w-full">
                <Button variant="outline" className="w-full border-gray-700 text-gray-400 hover:bg-gray-800" size="lg">
                  Create Admin Account
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

