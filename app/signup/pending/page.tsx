"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function PendingApproval() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-center">Application Pending</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Your driver application is being reviewed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
          <div className="text-center space-y-4">
            <p className="text-gray-300">
              Thank you for applying! Our team will review your application and get back to you soon.
            </p>
            <p className="text-gray-400 text-sm">
              You will receive an email notification once your application has been reviewed.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/">
              <Button className="w-full bg-primary text-white hover:bg-primary/90">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 