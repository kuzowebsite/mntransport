// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getDatabase, type Database } from "firebase/database"
import { getStorage, type FirebaseStorage } from "firebase/storage"

// Dummy data for development when Firebase is not configured
const dummyUserData = {
  uid: "dummy-user-id",
  email: "user@example.com",
  displayName: "Жишээ Хэрэглэгч",
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLLq8Qrq-PpOinyZmdYEX1ZC43-Mc8Rnk",
  authDomain: "ai-camerakz.firebaseapp.com",
  databaseURL: "https://ai-camerakz-default-rtdb.firebaseio.com",
  projectId: "ai-camerakz",
  storageBucket: "ai-camerakz.appspot.com", // Fixed the storage bucket URL
  messagingSenderId: "650577992128",
  appId: "1:650577992128:web:f13cf9d842a01b83e11025",
  measurementId: "G-V1KNMRDDG2",
}

// Initialize Firebase
let app: FirebaseApp | null = null
let auth: Auth | null = null
let database: Database | null = null
let storage: FirebaseStorage | null = null

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }

  // Initialize Firebase services
  auth = getAuth(app)
  database = getDatabase(app)
  storage = getStorage(app)

  // Enable Firebase logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("Firebase initialized with config:", {
      apiKey: firebaseConfig.apiKey?.substring(0, 5) + "...",
      authDomain: firebaseConfig.authDomain,
      databaseURL: firebaseConfig.databaseURL,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    })
  }
} catch (error) {
  console.error("Firebase initialization error:", error)
  app = null
  auth = null
  database = null
  storage = null
}

const hasValidConfig = !!(firebaseConfig && firebaseConfig.apiKey)

export { app, auth, database, storage, database as db, dummyUserData, hasValidConfig }
