"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Truck, AlertCircle } from "lucide-react"
import { SupportCase, PendingDriver, ActiveDriver, approveDriver, getSupportCases } from "@/lib/auth"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([])
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([])
  const [supportCases, setSupportCases] = useState<SupportCase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in and is admin
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
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      // Load pending drivers
      const pendingDriversRef = collection(db, "pendingDrivers")
      const pendingDriversSnapshot = await getDocs(pendingDriversRef)
      const pendingDriversData = pendingDriversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingDriver[]
      setPendingDrivers(pendingDriversData)

      // Load active drivers
      const activeDriversRef = collection(db, "drivers")
      const activeDriversSnapshot = await getDocs(activeDriversRef)
      const activeDriversData = activeDriversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActiveDriver[]
      setActiveDrivers(activeDriversData)

      // Load support cases
      const cases = await getSupportCases()
      setSupportCases(cases)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveDriver = async (driverId: string) => {
    try {
      await approveDriver(driverId)
      // Reload data after approval
      loadData()
    } catch (error) {
      console.error("Error approving driver:", error)
    }
  }

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case "load-not-showing":
        return "Load Not Showing"
      case "load-cancelled-showing":
        return "Load Cancelled But Showing"
      case "other-load-issue":
        return "Other Load Issue"
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  // Group active drivers by company
  const driversByCompany = activeDrivers.reduce((acc, driver) => {
    const company = driver.company || "Unknown"
    if (!acc[company]) {
      acc[company] = []
    }
    acc[company].push(driver)
    return acc
  }, {} as Record<string, ActiveDriver[]>)

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">Admin Dashboard</h1>

        <Tabs defaultValue="support" className="space-y-4">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="support" className="data-[state=active]:bg-primary">
              <AlertCircle className="h-4 w-4 mr-2" />
              Support Cases
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary">
              <Users className="h-4 w-4 mr-2" />
              Pending Drivers
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-primary">
              <Truck className="h-4 w-4 mr-2" />
              Active Drivers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="support">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Support Cases</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage driver support cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportCases.length === 0 ? (
                    <p className="text-gray-400">No support cases found.</p>
                  ) : (
                    supportCases.map((supportCase) => (
                      <Card key={supportCase.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-white">
                                  {supportCase.driverName}
                                </h3>
                                <Badge variant={supportCase.status === "open" ? "destructive" : "secondary"}>
                                  {supportCase.status}
                                </Badge>
                                <Badge variant="outline" className="text-primary">
                                  {getIssueTypeLabel(supportCase.issueType)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                {supportCase.driverEmail} • {supportCase.company}
                              </p>
                              <p className="text-sm text-gray-300 mt-2">
                                {supportCase.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Created: {new Date(supportCase.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Pending Drivers</CardTitle>
                <CardDescription className="text-gray-400">
                  Review and approve new driver applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingDrivers.length === 0 ? (
                    <p className="text-gray-400">No pending drivers found.</p>
                  ) : (
                    pendingDrivers.map((driver) => (
                      <Card key={driver.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-medium text-white">{driver.name}</h3>
                              <p className="text-sm text-gray-400">
                                {driver.email} • {driver.phone}
                              </p>
                              <p className="text-sm text-gray-400">Company: {driver.company}</p>
                            </div>
                            <Button
                              onClick={() => handleApproveDriver(driver.id)}
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
                            >
                              Approve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Active Drivers</CardTitle>
                <CardDescription className="text-gray-400">
                  View all approved drivers by company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(driversByCompany).map(([company, drivers]) => (
                    <div key={company} className="space-y-4">
                      <h3 className="text-lg font-medium text-white">{company}</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {drivers.map((driver) => (
                          <Card key={driver.id} className="bg-gray-800 border-gray-700">
                            <CardContent className="pt-6">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-white">{driver.name}</h4>
                                  <Badge>Active</Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                  {driver.email} • {driver.phone}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Approved: {new Date(driver.approvedAt).toLocaleString()}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

