"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { signupDriver } from "@/lib/auth"

export default function DriverSignup() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const result = await signupDriver({
        name: formData.name,
        email: formData.email,
        companyCode: formData.company.toUpperCase(),
        phone: formData.phone,
        password: formData.password
      })

      if (result.success) {
        router.push("/driver/pending")
      } else {
        setError(result.message || "Failed to create account")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </div>

        <div className="text-white mb-8">
          <h1 className="text-2xl font-bold">Driver Sign Up</h1>
          <p className="text-gray-400">Create your account to access the driver portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-gray-900 border-gray-800 text-white"
          />

          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-gray-900 border-gray-800 text-white"
          />

          <input
            type="text"
            placeholder="Company Identifier (e.g. AKOTL)"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value.toUpperCase() })}
            required
            maxLength={5}
            className="flex h-10 w-full rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white"
          />

          <Input
            type="tel"
            placeholder="Phone (Optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-gray-900 border-gray-800 text-white"
          />

          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="bg-gray-900 border-gray-800 text-white"
          />

          <Input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="bg-gray-900 border-gray-800 text-white"
          />

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>

          <div className="text-center text-gray-400">
            Already have an account?{" "}
            <Link href="/login?role=driver" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 