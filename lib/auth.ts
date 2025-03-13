import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from './firebase'

export type DriverSignupData = {
  email: string
  password: string
  name: string
  phone?: string
}

export async function signupDriver(data: DriverSignupData) {
  try {
    // Create auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    )

    // Create pending driver document
    await setDoc(doc(db, 'pendingDrivers', userCredential.user.uid), {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      status: 'pending',
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      message: 'Signup successful. Waiting for admin approval.'
    }
  } catch (error: any) {
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
    // Get driver data
    const driverRef = doc(db, 'pendingDrivers', driverId)
    const driverDoc = await getDocs(query(collection(db, 'pendingDrivers'), where('__name__', '==', driverId)))
    
    if (driverDoc.empty) {
      throw new Error('Driver not found')
    }

    const driverData = driverDoc.docs[0].data()

    // Move to approved drivers collection
    await setDoc(doc(db, 'drivers', driverId), {
      ...driverData,
      status: 'active',
      approvedAt: serverTimestamp()
    })

    // Remove from pending
    await deleteDoc(driverRef)

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