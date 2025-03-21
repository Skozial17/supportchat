"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, AlertCircle, LogOut, Building2 } from "lucide-react"
import { SupportCase, PendingDriver, approveDriver, getSupportCases, Company, getAllCompanies, createCompany, updateCompanyStatus } from "@/lib/auth"
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([])
  const [supportCases, setSupportCases] = useState<SupportCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [newCompany, setNewCompany] = useState({ name: '', code: '', adminEmail: '' })
  const [companyError, setCompanyError] = useState('')

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
    loadCompanies()
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

      // Load support cases
      const casesRef = collection(db, 'cases')
      const q = query(
        casesRef,
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const casesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SupportCase[]
      
      setSupportCases(casesData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const result = await getAllCompanies()
      if (result.success) {
        setCompanies(result.companies)
      }
    } catch (error) {
      console.error("Error loading companies:", error)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setCompanyError('')

    try {
      const result = await createCompany(newCompany)
      if (result.success) {
        setNewCompany({ name: '', code: '', adminEmail: '' })
        loadCompanies()
      } else {
        setCompanyError(result.message || 'Failed to create company')
      }
    } catch (error) {
      console.error("Error creating company:", error)
      setCompanyError('An error occurred while creating the company')
    }
  }

  const handleToggleCompanyStatus = async (companyId: string, isActive: boolean) => {
    try {
      const result = await updateCompanyStatus(companyId, !isActive)
      if (result.success) {
        loadCompanies()
      }
    } catch (error) {
      console.error("Error updating company status:", error)
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

  const handleCloseCase = async (caseId: string) => {
    try {
      const caseRef = doc(db, 'cases', caseId)
      await updateDoc(caseRef, {
        status: 'closed',
        updatedAt: new Date()
      })
      
      // Reload cases after update
      loadData()
    } catch (error) {
      console.error('Error closing case:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login?role=admin")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <Button 
            variant="outline" 
            className="bg-gray-800 hover:bg-gray-700 text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="support" className="space-y-4">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="support" className="data-[state=active]:bg-primary">
              <AlertCircle className="h-4 w-4 mr-2" />
              Support Cases
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-primary">
              <Building2 className="h-4 w-4 mr-2" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary">
              <Users className="h-4 w-4 mr-2" />
              Pending Drivers
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
                <div className="mb-4">
                  <Tabs defaultValue="open" className="w-full">
                    <TabsList className="bg-gray-800 w-full justify-start">
                      <TabsTrigger value="open">Open</TabsTrigger>
                      <TabsTrigger value="closed">Closed</TabsTrigger>
                      <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all">
                      <div className="space-y-4 mt-4">
                        {supportCases.length === 0 ? (
                          <p className="text-gray-400">No support cases found.</p>
                        ) : (
                          supportCases.map((supportCase) => (
                            <div 
                              key={supportCase.id} 
                              className="cursor-pointer transition-colors hover:bg-gray-700/50"
                              onClick={() => router.push(`/admin/case/${supportCase.id}`)}
                            >
                              <Card className="bg-gray-800 border-gray-700">
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <h3 className="font-medium text-white">
                                          {supportCase.title}
                                        </h3>
                                        <Badge variant={supportCase.status === "open" ? "destructive" : "secondary"}>
                                          {supportCase.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-400">
                                        Driver: {supportCase.driverName} • {supportCase.driverEmail} • {supportCase.company}
                                      </p>
                                      <p className="text-sm text-gray-300 mt-2 whitespace-pre-line">
                                        {supportCase.description}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-2">
                                        Created: {formatDate(supportCase.createdAt)}
                                      </p>
                                    </div>
                                    {supportCase.status === "open" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCloseCase(supportCase.id);
                                        }}
                                        className="ml-4"
                                      >
                                        Close Case
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="open">
                      <div className="space-y-4 mt-4">
                        {supportCases.filter(c => c.status === "open").length === 0 ? (
                          <p className="text-gray-400">No open cases found.</p>
                        ) : (
                          supportCases
                            .filter(c => c.status === "open")
                            .map((supportCase) => (
                              <div 
                                key={supportCase.id} 
                                className="cursor-pointer transition-colors hover:bg-gray-700/50"
                                onClick={() => router.push(`/admin/case/${supportCase.id}`)}
                              >
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <h3 className="font-medium text-white">
                                            {supportCase.title}
                                          </h3>
                                          <Badge variant="destructive">
                                            {supportCase.status}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                          Driver: {supportCase.driverName} • {supportCase.driverEmail} • {supportCase.company}
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2 whitespace-pre-line">
                                          {supportCase.description}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                          Created: {formatDate(supportCase.createdAt)}
                                        </p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCloseCase(supportCase.id);
                                        }}
                                        className="ml-4"
                                      >
                                        Close Case
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            ))
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="closed">
                      <div className="space-y-4 mt-4">
                        {supportCases.filter(c => c.status === "closed").length === 0 ? (
                          <p className="text-gray-400">No closed cases found.</p>
                        ) : (
                          supportCases
                            .filter(c => c.status === "closed")
                            .map((supportCase) => (
                              <div 
                                key={supportCase.id} 
                                className="cursor-pointer transition-colors hover:bg-gray-700/50"
                                onClick={() => router.push(`/admin/case/${supportCase.id}`)}
                              >
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <h3 className="font-medium text-white">
                                            {supportCase.title}
                                          </h3>
                                          <Badge variant="secondary">
                                            {supportCase.status}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                          Driver: {supportCase.driverName} • {supportCase.driverEmail} • {supportCase.company}
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2 whitespace-pre-line">
                                          {supportCase.description}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                          Created: {formatDate(supportCase.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Companies</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage registered companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Button
                    onClick={() => router.push('/admin/company/new')}
                    className="bg-primary text-white w-full md:w-auto"
                  >
                    Register New Company
                  </Button>
                </div>

                <div className="space-y-4">
                  {companies.length === 0 ? (
                    <p className="text-gray-400">No companies registered yet.</p>
                  ) : (
                    companies.map((company) => (
                      <Card key={company.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-white">
                                  {company.name}
                                </h3>
                                <Badge variant={company.isActive ? "default" : "secondary"}>
                                  {company.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                Code: {company.code}
                              </p>
                              <p className="text-sm text-gray-400">
                                Admin: {company.adminEmail}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {formatDate(company.createdAt)}
                              </p>
                              {company.drivers && company.drivers.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-300 mb-2">Active Drivers:</h4>
                                  <div className="space-y-2">
                                    {company.drivers.map((driver) => (
                                      <div key={driver.id} className="text-sm text-gray-400 flex items-center space-x-2">
                                        <span>{driver.name}</span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-500">{driver.email}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleCompanyStatus(company.id, company.isActive)}
                              className="ml-4"
                            >
                              {company.isActive ? "Deactivate" : "Activate"}
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

          <TabsContent value="pending">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Pending Drivers</CardTitle>
                <CardDescription className="text-gray-400">
                  Approve or reject pending driver registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingDrivers.length === 0 ? (
                    <p className="text-gray-400">No pending driver registrations.</p>
                  ) : (
                    pendingDrivers.map((driver) => (
                      <Card key={driver.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-medium text-white">
                                {driver.name}
                              </h3>
                              <p className="text-sm text-gray-400">
                                Email: {driver.email}
                              </p>
                              <p className="text-sm text-gray-400">
                                Company Code: {driver.companyCode}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveDriver(driver.id)}
                              className="ml-4"
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
        </Tabs>
      </div>
    </div>
  )
}

