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
  orderBy
} from 'firebase/firestore'
import { auth, db } from './firebase'

export type DriverSignupData = {
  email: string
  password: string
  name: string
  phone?: string
  company: string
}

export async function signupDriver(data: DriverSignupData) {
  try {
    console.log('Starting driver signup process...')
    
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
      company: data.company,
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

export async function addCaseMessage(caseId: string, data: {
  text: string
  sender: "system" | "driver" | "admin"
}) {
  try {
    const messageId = `msg-${Date.now()}`
    const messageData = {
      id: messageId,
      text: data.text,
      sender: data.sender,
      createdAt: serverTimestamp()
    }

    await setDoc(
      doc(db, 'cases', caseId, 'messages', messageId), 
      messageData
    )

    return {
      success: true,
      messageId
    }
  } catch (error) {
    console.error('Error adding case message:', error)
    throw error
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