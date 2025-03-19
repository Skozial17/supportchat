import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  orderBy,
  addDoc,
  updateDoc
} from 'firebase/firestore'
import { auth, db } from './firebase'

export type DriverSignupData = {
  email: string
  password: string
  name: string
  phone?: string
  companyCode: string
}

export async function signupDriver(data: DriverSignupData) {
  try {
    console.log('Starting driver signup process...')
    
    // First verify the company code exists
    const companyResult = await getCompanyByCode(data.companyCode)
    if (!companyResult.success) {
      return {
        success: false,
        message: 'Invalid company code. Please check and try again.'
      }
    }

    // Create auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    )
    
    console.log('Auth account created:', userCredential.user.uid)

    // Create pending driver document
    const driverData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: companyResult.company.name,
      companyCode: data.companyCode.toUpperCase(),
      status: 'pending',
      appliedAt: serverTimestamp(),
      uid: userCredential.user.uid
    }
    
    console.log('Creating pending driver document:', driverData)
    
    await setDoc(doc(db, 'pendingDrivers', userCredential.user.uid), driverData)
    
    console.log('Pending driver document created successfully')

    return {
      success: true,
      message: 'Signup successful. Waiting for admin approval.'
    }
  } catch (error: any) {
    console.error('Error in signupDriver:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

export async function checkDriverStatus(userId: string) {
  try {
    // Check pending drivers
    const pendingDoc = await getDoc(doc(db, 'pendingDrivers', userId))
    if (pendingDoc.exists()) {
      return {
        status: 'pending',
        data: pendingDoc.data()
      }
    }

    // Check approved drivers
    const approvedDoc = await getDoc(doc(db, 'approvedDrivers', userId))
    if (approvedDoc.exists()) {
      return {
        status: 'approved',
        data: approvedDoc.data()
      }
    }

    return {
      status: 'unknown',
      data: null
    }
  } catch (error) {
    console.error('Error checking driver status:', error)
    throw error
  }
}

export async function getPendingDrivers() {
  try {
    const q = query(
      collection(db, 'pendingDrivers'),
      where('status', '==', 'pending')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate() || new Date()
    }))
  } catch (error) {
    console.error('Error getting pending drivers:', error)
    return []
  }
}

export async function approveDriver(driverId: string) {
  try {
    console.log('Starting approval process for driver:', driverId)
    
    // Get driver data
    const driverRef = doc(db, 'pendingDrivers', driverId)
    const driverDoc = await getDoc(driverRef)
    
    if (!driverDoc.exists()) {
      console.error('Driver not found:', driverId)
      throw new Error('Driver not found')
    }

    const driverData = driverDoc.data()
    console.log('Found driver data:', driverData)

    // Move to approved drivers collection
    await setDoc(doc(db, 'drivers', driverId), {
      ...driverData,
      status: 'active',
      approvedAt: serverTimestamp()
    })
    console.log('Added to drivers collection')

    // Remove from pending
    await deleteDoc(driverRef)
    console.log('Removed from pending collection')

    // TODO: Send email notification to driver

    return true
  } catch (error) {
    console.error('Error approving driver:', error)
    throw error
  }
}

export const rejectDriver = async (driverId: string) => {
  try {
    // Get driver data for email notification
    const driverRef = doc(db, 'pendingDrivers', driverId)
    
    // Delete from pending drivers
    await deleteDoc(driverRef)

    // TODO: Send email notification to driver

    return true
  } catch (error) {
    console.error('Error rejecting driver:', error)
    throw error
  }
}

export type SignInData = {
  email: string
  password: string
}

export async function signIn(data: SignInData) {
  try {
    console.log('Starting sign in process...')
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    )
    
    console.log('User signed in:', userCredential.user.uid)
    
    // Check if user is admin
    const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid))
    const isAdmin = adminDoc.exists()
    
    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: isAdmin ? 'admin' : 'driver'
      }
    }
  } catch (error: any) {
    console.error('Error signing in:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

export async function createAdminAccount({ email, password, name }: { 
  email: string 
  password: string
  name: string
}) {
  try {
    console.log('Creating admin account...')
    
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    console.log('Created auth account:', user.uid)

    // Create the admin document
    await setDoc(doc(db, 'admins', user.uid), {
      email,
      name,
      role: 'admin',
      createdAt: serverTimestamp()
    })
    
    console.log('Created admin document')

    return { success: true, uid: user.uid }
  } catch (error: any) {
    console.error('Error creating admin account:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to create admin account'
    }
  }
}

export type LoadIssueType = 
  | "load-not-showing"
  | "load-cancelled-showing"
  | "other-load-issue"

export type SupportCase = {
  id: string
  driverId: string
  driverName: string
  driverEmail: string
  company: string
  title: string
  description: string
  status: "open" | "closed"
  createdAt: Date
  updatedAt: Date
}

export type CaseMessage = {
  id: string
  text: string
  sender: "system" | "driver" | "admin"
  createdAt: Date
}

export async function addCaseMessage(caseId: string, message: { text: string; sender: "admin" | "driver" | "system" }) {
  try {
    const messagesRef = collection(db, "cases", caseId, "messages");
    await addDoc(messagesRef, {
      ...message,
      createdAt: serverTimestamp()
    });

    // Update the case's updatedAt timestamp
    const caseRef = doc(db, "cases", caseId);
    await updateDoc(caseRef, {
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding message:", error);
    return { success: false, error };
  }
}

export async function getCaseMessages(caseId: string) {
  try {
    const q = query(
      collection(db, 'cases', caseId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as CaseMessage[]
  } catch (error) {
    console.error('Error getting case messages:', error)
    return []
  }
}

export async function createSupportCase(data: {
  driverId: string
  driverName: string
  driverEmail: string
  company: string
  title: string
  description: string
  status: "open" | "closed"
}) {
  try {
    const caseId = `case-${Date.now()}`
    const timestamp = serverTimestamp()
    const caseData = {
      ...data,
      id: caseId,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    // Create the case document
    await setDoc(doc(db, 'cases', caseId), caseData)

    // Add initial system message
    await addCaseMessage(caseId, {
      text: `Case created: ${data.description}`,
      sender: "system"
    })

    return {
      success: true,
      caseId
    }
  } catch (error: any) {
    console.error('Error creating support case:', error)
    throw error
  }
}

export async function getSupportCases() {
  try {
    const q = query(
      collection(db, 'cases'),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as SupportCase[]
  } catch (error) {
    console.error('Error getting support cases:', error)
    return []
  }
}

export type Company = {
  id: string
  name: string
  code: string // Unique company identifier (e.g., AKOTL)
  adminEmail: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  phone?: string
  address?: string
  contactPerson?: string
  drivers?: Array<{
    id: string
    name: string
    email: string
  }>
}

// Function to create a new company
export async function createCompany(data: {
  name: string
  code: string
  adminEmail: string
  phone?: string
  address?: string
  contactPerson?: string
}) {
  try {
    // Check if company code already exists
    const companyRef = collection(db, 'companies')
    const q = query(companyRef, where('code', '==', data.code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      return { success: false, message: 'Company code already exists' }
    }

    // Create new company
    const companyData = {
      name: data.name,
      code: data.code.toUpperCase(), // Store code in uppercase
      adminEmail: data.adminEmail,
      phone: data.phone || null,
      address: data.address || null,
      contactPerson: data.contactPerson || null,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'companies'), companyData)
    
    return { 
      success: true, 
      companyId: docRef.id,
      message: 'Company created successfully' 
    }
  } catch (error) {
    console.error('Error creating company:', error)
    return { success: false, message: 'Failed to create company' }
  }
}

// Function to get company by code
export async function getCompanyByCode(code: string | undefined) {
  try {
    if (!code) {
      return { success: false, message: 'Company code is required' }
    }

    const companyRef = collection(db, 'companies')
    const q = query(companyRef, where('code', '==', code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { success: false, message: 'Company not found' }
    }

    const companyData = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as Company

    return { success: true, company: companyData }
  } catch (error) {
    console.error('Error getting company:', error)
    return { success: false, message: 'Failed to get company' }
  }
}

// Function to update company status
export async function updateCompanyStatus(companyId: string, isActive: boolean) {
  try {
    const companyRef = doc(db, 'companies', companyId)
    await updateDoc(companyRef, {
      isActive,
      updatedAt: serverTimestamp()
    })

    return { success: true, message: 'Company status updated successfully' }
  } catch (error) {
    console.error('Error updating company status:', error)
    return { success: false, message: 'Failed to update company status' }
  }
}

// Function to get all companies
export async function getAllCompanies() {
  try {
    const companiesRef = collection(db, 'companies')
    const q = query(companiesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const companies = await Promise.all(snapshot.docs.map(async doc => {
      const companyData = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as Company

      // Get drivers for this company
      const driversRef = collection(db, 'drivers')
      const driversQuery = query(driversRef, where('company', '==', companyData.name))
      const driversSnapshot = await getDocs(driversQuery)
      
      companyData.drivers = driversSnapshot.docs.map(driverDoc => ({
        id: driverDoc.id,
        name: driverDoc.data().name,
        email: driverDoc.data().email
      }))

      return companyData
    }))

    return { success: true, companies }
  } catch (error) {
    console.error('Error getting companies:', error)
    return { success: false, message: 'Failed to get companies' }
  }
}

// Function to update driver's company
export async function updateDriverCompany(driverId: string, companyName: string) {
  try {
    const driverRef = doc(db, 'drivers', driverId)
    await updateDoc(driverRef, {
      company: companyName,
      updatedAt: serverTimestamp()
    })

    return { success: true, message: 'Driver company updated successfully' }
  } catch (error) {
    console.error('Error updating driver company:', error)
    return { success: false, message: 'Failed to update driver company' }
  }
}

export async function updateCaseStatus(caseId: string, status: "open" | "closed") {
  try {
    const caseRef = doc(db, "cases", caseId)
    await updateDoc(caseRef, {
      status,
      updatedAt: serverTimestamp()
    })

    // Add a system message about the status change
    await addCaseMessage(caseId, {
      text: `Case ${status === "open" ? "reopened" : "closed"}`,
      sender: "system"
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating case status:", error)
    return { success: false, error }
  }
} 