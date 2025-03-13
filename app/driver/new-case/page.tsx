"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LoadIssueType, createSupportCase } from "@/lib/auth"

export default function NewCase() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    issueType: "" as LoadIssueType,
    description: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (!formData.issueType || !formData.description) {
        setError("Please fill in all required fields")
        return
      }

      const result = await createSupportCase({
        driverId: user.uid,
        driverName: user.name || user.email.split('@')[0],
        driverEmail: user.email,
        company: "KozialTrans", // We can get this from user data later
        issueType: formData.issueType,
        description: formData.description
      })

      if (result.success) {
        router.push(`/driver/case/${result.caseId}`)
      }
    } catch (error: any) {
      setError(error.message || "Failed to create support case")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="container mx-auto max-w-2xl">
        <Link href="/driver/dashboard" className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Report Load Issue</CardTitle>
            <CardDescription className="text-gray-400">
              Please provide details about your load issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Issue Type
                </label>
                <Select
                  value={formData.issueType}
                  onValueChange={(value) => 
                    setFormData({ ...formData, issueType: value as LoadIssueType })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select an issue type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="load-not-showing" className="text-white">
                      Load is not showing in my app
                    </SelectItem>
                    <SelectItem value="load-cancelled-showing" className="text-white">
                      Load was cancelled but still showing
                    </SelectItem>
                    <SelectItem value="other-load-issue" className="text-white">
                      Other load issue
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => 
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Please provide more details about your issue..."
                  className="h-32 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-white hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Case..." : "Submit Case"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

