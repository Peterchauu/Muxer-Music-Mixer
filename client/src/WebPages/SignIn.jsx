//Requirement 4

import { useState } from "react"

// Sign-in webpage with input form fields assuming user already has a account, will authenticate with firebase

function SignIn () {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Sign In Attempt with: ", {email, password})
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
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
            </form>
        </div>
    )
}

export default SignIn