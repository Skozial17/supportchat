"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { LogOut, MessageSquare, User, Search, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import { getPendingDrivers, approveDriver, rejectDriver } from "@/lib/auth"

// Define the case structure
type Case = {
  id: string
  driverId: string
  driverName: string
  title: string
  lastMessage: string
  status: "open" | "closed"
  createdAt: Date
  updatedAt: Date
}

// Define the pending driver structure
type PendingDriver = {
  id: string
  name: string
  email: string
  phone?: string
  appliedAt: Date
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("cases")

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login?role=admin")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    if (parsedUser.role !== "admin") {
      router.push("/login?role=admin")
      return
    }

    setUser(parsedUser)

    // Load pending drivers
    const loadPendingDrivers = async () => {
      try {
        const drivers = await getPendingDrivers()
        setPendingDrivers(drivers)
      } catch (error) {
        console.error("Failed to load pending drivers:", error)
      }
    }

    loadPendingDrivers()

    // Mock API call to get cases
    setTimeout(() => {
      const mockCases: Case[] = [
        {
          id: "case-001",
          driverId: "D12345",
          driverName: "John Driver",
          title: "Load not showing correctly",
          lastMessage: "Please type VRID affected",
          status: "open",
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 1800000),
        },
        {
          id: "case-002",
          driverId: "D67890",
          driverName: "Jane Smith",
          title: "App navigation issue",
          lastMessage: "Thank you for your report. Our team is investigating.",
          status: "open",
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 43200000),
        },
        {
          id: "case-003",
          driverId: "D54321",
          driverName: "Mike Johnson",
          title: "Completed delivery confirmation",
          lastMessage: "Your delivery has been confirmed. Thank you!",
          status: "closed",
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 86400000),
        },
        {
          id: "case-004",
          driverId: "D11111",
          driverName: "Sarah Williams",
          title: "Route optimization request",
          lastMessage: "We have updated your route. Please refresh your app.",
          status: "open",
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 3600000),
        },
        {
          id: "case-005",
          driverId: "D22222",
          driverName: "Robert Brown",
          title: "Delivery delay notification",
          lastMessage: "Thank you for notifying us about the delay.",
          status: "closed",
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(Date.now() - 172800000),
        },
      ]

      setCases(mockCases)
      setFilteredCases(mockCases)
      setIsLoading(false)
    }, 1000)
  }, [router])

  useEffect(() => {
    // Filter cases based on search query
    if (searchQuery.trim() === "") {
      setFilteredCases(cases)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = cases.filter(
        (c) =>
          c.id.toLowerCase().includes(query) ||
          c.driverId.toLowerCase().includes(query) ||
          c.driverName.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.lastMessage.toLowerCase().includes(query),
      )
      setFilteredCases(filtered)
    }
  }, [searchQuery, cases])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login?role=admin")
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleApproveDriver = async (driverId: string) => {
    try {
      await approveDriver(driverId)
      setPendingDrivers(pendingDrivers.filter(d => d.id !== driverId))
    } catch (error) {
      console.error("Failed to approve driver:", error)
    }
  }

  const handleRejectDriver = async (driverId: string) => {
    try {
      await rejectDriver(driverId)
      setPendingDrivers(pendingDrivers.filter(d => d.id !== driverId))
    } catch (error) {
      console.error("Failed to reject driver:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Support Portal</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-300">
              <User className="h-4 w-4 mr-2" />
              <span>{user?.name || "Admin"}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="cases" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900">
            <TabsTrigger value="cases" className="text-white data-[state=active]:bg-primary">
              Support Cases
            </TabsTrigger>
            <TabsTrigger value="drivers" className="text-white data-[state=active]:bg-primary">
              Pending Drivers
              {pendingDrivers.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingDrivers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Support Cases Dashboard</h2>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search by case ID, driver name, or title..."
                  className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium tracking-tight text-white">Total Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tracking-tight text-white">{cases.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium tracking-tight text-white">Open Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tracking-tight text-white">
                      {cases.filter((c) => c.status === "open").length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {filteredCases.map((case_) => (
                  <Link key={case_.id} href={`/admin/case/${case_.id}`}>
                    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{case_.title}</h3>
                            <p className="text-sm text-gray-400">
                              {case_.driverName} ({case_.driverId})
                            </p>
                          </div>
                          <Badge variant={case_.status === "open" ? "destructive" : "secondary"}>
                            {case_.status}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{case_.lastMessage}</p>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>Created: {formatDate(case_.createdAt)}</span>
                          <span>Updated: {formatDate(case_.updatedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drivers">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Pending Driver Applications</h2>
              
              {pendingDrivers.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center text-gray-400">
                    No pending driver applications at this time.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingDrivers.map((driver) => (
                    <Card key={driver.id} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-white">{driver.name}</h3>
                            <p className="text-sm text-gray-400">{driver.email}</p>
                            {driver.phone && (
                              <p className="text-sm text-gray-400">{driver.phone}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Applied: {formatDate(driver.appliedAt)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveDriver(driver.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectDriver(driver.id)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

