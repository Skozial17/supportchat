"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This page is now just a redirect to the chat page
export default function NewChat() {
  const router = useRouter()

  useEffect(() => {
    // Generate a new case ID and redirect to chat
    const caseId = `case-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`
    router.push(`/driver/chat/${caseId}`)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <p>Redirecting to support chat...</p>
    </div>
  )
}

