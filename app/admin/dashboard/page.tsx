"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { LogOut, MessageSquare, User, Search } from "lucide-react"
import Link from "next/link"

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

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Support Cases Dashboard</h2>

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
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 bg-gray-900">
            <TabsTrigger value="all" className="text-gray-300 data-[state=active]:bg-gray-800">All Cases</TabsTrigger>
            <TabsTrigger value="open" className="text-gray-300 data-[state=active]:bg-gray-800">Open Cases</TabsTrigger>
            <TabsTrigger value="closed" className="text-gray-300 data-[state=active]:bg-gray-800">Closed Cases</TabsTrigger>
          </TabsList>

          {["all", "open", "closed"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="p-3 text-left text-gray-300">Case ID</th>
                      <th className="p-3 text-left text-gray-300">Driver</th>
                      <th className="p-3 text-left text-gray-300">Title</th>
                      <th className="p-3 text-left text-gray-300">Status</th>
                      <th className="p-3 text-left text-gray-300">Created</th>
                      <th className="p-3 text-left text-gray-300">Last Updated</th>
                      <th className="p-3 text-left text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases
                      .filter((c) => {
                        if (tabValue === "all") return true
                        if (tabValue === "open") return c.status === "open"
                        if (tabValue === "closed") return c.status === "closed"
                        return true
                      })
                      .map((supportCase) => (
                        <tr key={supportCase.id} className="border-b border-gray-800 hover:bg-gray-900">
                          <td className="p-3 text-gray-300">{supportCase.id}</td>
                          <td className="p-3 tracking-tight">
                            <div>
                              <div className="font-medium text-white">{supportCase.driverName}</div>
                              <div className="text-xs text-gray-400">{supportCase.driverId}</div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-300">{supportCase.title}</td>
                          <td className="p-3">
                            <Badge variant={supportCase.status === "open" ? "default" : "secondary"}>
                              {supportCase.status}
                            </Badge>
                          </td>
                          <td className="p-3 whitespace-nowrap text-gray-300">{formatDate(supportCase.createdAt)}</td>
                          <td className="p-3 whitespace-nowrap text-gray-300">{formatDate(supportCase.updatedAt)}</td>
                          <td className="p-3">
                            <Link href={`/admin/case/${supportCase.id}`}>
                              <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {filteredCases.filter((c) => {
                  if (tabValue === "all") return true
                  if (tabValue === "open") return c.status === "open"
                  if (tabValue === "closed") return c.status === "closed"
                  return true
                }).length === 0 && (
                  <div className="text-center p-8">
                    <p className="text-gray-400">No cases found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}

