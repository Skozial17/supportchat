"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createAdminAccount } from "@/lib/auth"
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function AdminSetup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await createAdminAccount({
        email: "kozialtransltd@gmail.com",
        password: "KozialAdmin2024!",
        name: "Kozial Transport Admin"
      })

      if (result.success) {
        setSuccess(`Admin account created successfully! Please save these credentials:
        Email: kozialtransltd@gmail.com
        Password: KozialAdmin2024!
        
        Redirecting to login page in 10 seconds...`)
        
        setTimeout(() => {
          router.push("/login?role=admin")
        }, 10000)
      } else {
        setError(result.message || 'Failed to create admin account')
      }
    } catch (error: any) {
      console.error('Error in admin setup:', error)
      setError(error.message || 'An error occurred during setup')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Kozial Transport Admin Account</CardTitle>
          <CardDescription>
            This will create the admin account with the following credentials:
            <br />
            Email: kozialtransltd@gmail.com
            <br />
            Password: KozialAdmin2024!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <AlertDescription className="whitespace-pre-line">{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Admin Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 