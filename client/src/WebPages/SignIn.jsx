import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebaseInit";
import { ref, get, set, update } from "firebase/database";


// Requirement 3 fulfilled

function getFriendlyErrorMessage(error) {
  // Fall back if we don't get a proper error object
  const code = error?.code || "";

  // Most common credential cases
  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  ) {
    return "Invalid email or password.";
  }

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Please check your internet connection and try again.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // Default generic message
  return "Something went wrong while signing in. Please try again.";
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const navigate = useNavigate();

  // Sign-in webpage with input form fields assuming user already has an account,
  // will authenticate with firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp in Realtime Database
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        await update(userRef, {
          lastLogin: Date.now()
        });
      } else {
        // Create basic user data if it doesn't exist (for legacy users)
        await set(userRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split('@')[0],
          createdAt: Date.now(),
          lastLogin: Date.now()
        });
      }
      
      console.log("User: ", userCredential.user, " signed in");
      navigate("/");
    } catch (err) {
      console.error("Error signing in: ", err);
      setError(getFriendlyErrorMessage(err));
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(email || ""); // pre-fill with current email if any
    setResetMessage("");
    setResetError("");
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetMessage("");
    setResetError("");

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("If an account exists with this email, a reset link has been sent.");
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else if (err.code === "auth/user-not-found") {
        // You can keep this generic so you don't leak which emails exist
        setResetMessage("If an account exists with this email, a reset link has been sent.");
      } else {
        setResetError("Unable to send reset email. Please try again later.");
      }
    }
  };

  const handleModalClose = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetMessage("");
    setResetError("");
  };

  return (
    <>

      {/* Requirement 4 fulfilled (1/2) */}

      <div className={`flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${showForgotPassword ? "blur-sm" : ""}`}>
        <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] w-96 border border-blue-500/30">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Sign In</h2>

          {error && (
            <p className="text-red-500 text-sm mb-2 text-center">
              {error}
            </p>
          )}

          <label className="block mb-4 text-center">
            <span className="text-gray-300 font-medium">Email</span>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 border border-blue-500/30 text-white p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              required
            />
          </label>

          <label className="block mb-6 text-center">
            <span className="text-gray-300 font-medium">Password</span>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-blue-500/30 text-white p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full bg-blue-600/20 text-blue-400 py-3 rounded-lg border border-blue-600/50 hover:bg-blue-600 hover:text-white font-bold transition-all"
          >
            Sign In
          </button>

          {/* Requirement 5 fulfilled */}

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full mt-4 text-blue-400 hover:text-blue-300 underline text-sm transition-colors"
          >
            I forgot my password
          </button>
        </form>
      </div>

      {/* forgot password menu */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-slate-800 border border-blue-500/30 p-8 rounded-lg shadow-[0_0_50px_rgba(59,130,246,0.5)] w-96 mx-4">
            <h3 className="text-xl font-bold mb-4 text-center text-white">Reset Password</h3>
            <form onSubmit={handleResetSubmit}>
              <label className="block mb-4">
                <span className="text-gray-300 font-medium">Email Address</span>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-slate-700 border border-blue-500/30 text-white p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  required
                />
              </label>

              {resetMessage && (
                <p className="text-sm text-green-600 mb-4">
                  {resetMessage}
                </p>
              )}

              {resetError && (
                <p className="text-sm text-red-600 mb-4">
                  {resetError}
                </p>
              )}

              {!resetMessage && !resetError && (
                <p className="text-sm text-gray-400 mb-6">
                  If any account exists with this email, a notification will be sent to reset the password.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 bg-slate-700 text-gray-300 py-3 rounded-lg hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600/20 text-blue-400 py-3 rounded-lg border border-blue-600/50 hover:bg-blue-600 hover:text-white font-bold transition-all"
                >
                  Send Reset Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default SignIn;
