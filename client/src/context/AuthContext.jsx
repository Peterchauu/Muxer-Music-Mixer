import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebaseInit"; 

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for login/logout events
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User logged out - clear localStorage
        localStorage.removeItem('userPlaylists');
        localStorage.removeItem('cachedTracks');
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    // Clear localStorage before signing out
    localStorage.removeItem('userPlaylists');
    localStorage.removeItem('cachedTracks');
    
    // Dispatch event to reset mixer
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    return signOut(auth);
  };

  const value = {
    currentUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}