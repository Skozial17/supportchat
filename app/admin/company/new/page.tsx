"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createCompany } from "@/lib/auth"

export default function NewCompany() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    adminEmail: "",
    phone: "",
    address: "",
    contactPerson: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await createCompany({
        name: formData.name,
        code: formData.code,
        adminEmail: formData.adminEmail
      })

      if (result.success) {
        router.push("/admin/dashboard?tab=companies")
      } else {
        setError(result.message || "Failed to create company")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Link 
            href="/admin/dashboard?tab=companies" 
            className="text-gray-400 hover:text-white inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Register New Company</CardTitle>
            <CardDescription className="text-gray-400">
              Add a new transport company to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-900 rounded-lg text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Company Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Transport Company Name"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-300">Company Identifier</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., TEMP"
                  className="bg-gray-800 border-gray-700 text-white uppercase"
                  required
                />
                <p className="text-sm text-gray-400">
                  A unique code that drivers will use to join this company
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-gray-300">Admin Email</Label>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-gray-300">Contact Person</Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-300">Company Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Company Address"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating Company..." : "Create Company"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 