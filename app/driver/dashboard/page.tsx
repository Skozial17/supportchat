"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, LogOut } from "lucide-react"
import Link from "next/link"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { SupportCase } from "@/lib/auth"

export default function DriverDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cases, setCases] = useState<SupportCase[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    loadCases(parsedUser.uid)
  }, [router])

  const loadCases = async (driverId: string) => {
    try {
      const casesRef = collection(db, 'cases')
      const q = query(
        casesRef,
        where('driverId', '==', driverId)
        // Temporarily removed orderBy until index is created
      )
      
      const snapshot = await getDocs(q)
      const casesData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        }
      }) as SupportCase[]
      
      // Sort cases in memory instead
      casesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      setCases(casesData)
    } catch (error) {
      console.error('Error loading cases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login?role=driver")
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto p-4 pb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Support Cases</h2>
            <p className="text-gray-400">View and manage your support requests</p>
          </div>
          <Button 
            variant="outline" 
            className="bg-gray-800 hover:bg-gray-700 text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="mb-4 bg-gray-900">
            <TabsTrigger value="open" className="text-gray-300 data-[state=active]:bg-gray-800">
              Open
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-gray-300 data-[state=active]:bg-gray-800">
              Closed
            </TabsTrigger>
            <TabsTrigger value="all" className="text-gray-300 data-[state=active]:bg-gray-800">
              All
            </TabsTrigger>
          </TabsList>

          {["open", "closed", "all"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {cases
                .filter((c) => tabValue === "all" || c.status === tabValue)
                .map((supportCase) => (
                  <Link key={supportCase.id} href={`/driver/case/${supportCase.id}`}>
                    <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-white">{supportCase.title}</h3>
                          <p className="text-sm text-gray-400">{supportCase.description}</p>
                        </div>
                        <Badge variant={supportCase.status === "open" ? "destructive" : "secondary"}>
                          {supportCase.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">Last updated: {formatDate(supportCase.updatedAt)}</div>
                    </Card>
                  </Link>
                ))}

              {cases.filter((c) => tabValue === "all" || c.status === tabValue).length === 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <div className="p-6 text-center text-gray-400">No {tabValue} cases found.</div>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="container mx-auto">
          <Link href="/driver/case/new">
            <Button className="w-full bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Support Case
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

