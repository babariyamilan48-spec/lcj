import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAfvuTYMGJFSWBeDyjiBluopVl0kp045P8',
  authDomain: 'lifechangingjourney-c880e.firebaseapp.com',
  projectId: 'lifechangingjourney-c880e',
  storageBucket: 'lifechangingjourney-c880e.firebasestorage.app',
  messagingSenderId: '1004143214625',
  appId: '1:1004143214625:web:0f1fb6d338b9d73dc56360',
  measurementId: 'G-CCBFV4XF14',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
