import { useState } from "react"


// Requirement 3 fulfilled

function SignIn () {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetEmail, setResetEmail] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Sign In Attempt with: ", {email, password})
    }

    const handleForgotPassword = () => {
        setShowForgotPassword(true)
        setResetEmail("") 
    }

    const handleResetSubmit = (e) => {
        e.preventDefault();
        console.log("Password reset requested for:", resetEmail)
        setShowForgotPassword(false)
        setResetEmail("")
    }

    const handleModalClose = () => {
        setShowForgotPassword(false)
        setResetEmail("")
    }

    return (
        <>


            {/* Requirement 4 fulfilled (1/2) */}
        
            <div className={`flex justify-center items-center min-h-screen bg-gray-100 ${showForgotPassword ? 'blur-sm' : ''}`}>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80 border-2">
                    <h2 className="text-xl font-bold mb-4 text-center">Sign In</h2>
                    <label className="block mb-2 text-center">
                        Email
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded mt-1" required>
                        </input>
                    </label>
                    <label className="block mb-4 text-center">
                        Password
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 mt-1" required>
                        </input>
                    </label>
                    <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
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
                            <p className="text-sm text-gray-600 mb-6">
                                If any account exists with this email, a notification will be sent to reset the password
                            </p>
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
    )
}

export default SignIn