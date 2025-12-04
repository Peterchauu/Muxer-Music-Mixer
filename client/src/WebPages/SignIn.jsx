import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebaseInit";


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
      console.log("User: ", userCredential.user, " signed in");
      navigate("/account");
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

      <div className={`flex justify-center items-center min-h-screen bg-gray-100 ${showForgotPassword ? "blur-sm" : ""}`}>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80 border-2">
          <h2 className="text-xl font-bold mb-4 text-center">Sign In</h2>

          {error && (
            <p className="text-red-500 text-sm mb-2 text-center">
              {error}
            </p>
          )}

          <label className="block mb-2 text-center">
            Email
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded mt-1"
              required
            />
          </label>

          <label className="block mb-4 text-center">
            Password
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 mt-1"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Sign In
          </button>

          {/* Requirement 5 fulfilled */}

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full mt-3 text-blue-500 hover:text-blue-700 underline text-sm"
          >
            I forgot my password
          </button>
        </form>
      </div>

      {/* forgot password menu */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96 mx-4">
            <h3 className="text-xl font-bold mb-4 text-center">Reset Password</h3>
            <form onSubmit={handleResetSubmit}>
              <label className="block mb-4">
                Email Address
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full border p-3 rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="text-sm text-gray-600 mb-6">
                  If any account exists with this email, a notification will be sent to reset the password.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
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
