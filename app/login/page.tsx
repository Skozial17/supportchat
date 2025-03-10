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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Mock authentication - in a real app, this would call an API
    setTimeout(() => {
      setIsLoading(false)

      // Simple validation
      if (!formData.email || !formData.password) {
        setError("Please enter both email and password")
        return
      }

      // Mock credentials for demo purposes
      const validCredentials = {
        driver: { email: "driver@example.com", password: "password" },
        admin: { email: "admin@example.com", password: "password" },
      }

      if (
        formData.email === validCredentials[role as keyof typeof validCredentials].email &&
        formData.password === validCredentials[role as keyof typeof validCredentials].password
      ) {
        // Store user info in localStorage (use a proper auth solution in production)
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: formData.email,
            role: role,
            id: role === "driver" ? "D12345" : "A98765",
            name: role === "driver" ? "John Driver" : "Admin User",
          }),
        )

        // Redirect based on role
        if (role === "driver") {
          router.push("/driver/dashboard")
        } else {
          router.push("/admin/dashboard")
        }
      } else {
        setError("Invalid email or password")
      }
    }, 1000)
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
                placeholder={role === "driver" ? "driver@example.com" : "admin@example.com"}
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
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            For demo purposes, use:
            {role === "driver" ? " driver@example.com / password" : " admin@example.com / password"}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


