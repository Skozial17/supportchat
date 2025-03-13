"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { signIn } from "@/lib/auth"

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "driver"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simple validation
      if (!formData.email || !formData.password) {
        setError("Please enter both email and password")
        return
      }

      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      if (result.success && result.user) {
        // Check if user role matches the requested role
        if ((role === 'admin' && result.user.role !== 'admin') || 
            (role === 'driver' && result.user.role !== 'driver')) {
          setError(`Invalid credentials for ${role} login`)
          return
        }

        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          ...result.user,
          name: result.user.email?.split('@')[0] || 'User'
        }))

        // Redirect based on role
        if (result.user.role === 'driver') {
          router.push('/driver/dashboard')
        } else {
          router.push('/admin/dashboard')
        }
      } else {
        setError(result.message || 'Invalid email or password')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center">
            <Link href="/" className="mr-2">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle>{role === "driver" ? "Driver Login" : "Administrator Login"}</CardTitle>
              <CardDescription>
                Enter your credentials to access the {role === "driver" ? "driver" : "administrator"} portal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


