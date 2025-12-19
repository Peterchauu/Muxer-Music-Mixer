import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth, db } from "../services/firebaseInit"
import { useNavigate } from "react-router-dom"
import { ref, set } from "firebase/database";


// Requirement 2 fulfilled

function Register () {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [dateOfBirth, setDateofBirth] = useState("")

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)

            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`,
            })

            // Save user data to Realtime Database
            const userRef = ref(db, `users/${userCredential.user.uid}`);
            await set(userRef, {
                email: email,
                firstName: firstName,
                lastName: lastName,
                dateOfBirth: dateOfBirth,
                displayName: `${firstName} ${lastName}`,
                createdAt: Date.now()
            });

            console.log("User registered and profile saved: ", userCredential.user)
            
            navigate("/"); 
            

        } catch (err) {
            console.error("Error registering: ", err.message)
            setError(err.message)
        }
    }

    {/* Requirement 4 fulfilled (2/2) */}

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] w-96 border border-blue-500/30">
                {error && (
                    <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
                )}
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Register</h2>

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

                <label className="block mb-4 text-center">
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

                <label className="block mb-4 text-center">
                    <span className="text-gray-300 font-medium">First Name</span>
                    <input
                        type="text"
                        placeholder="Bobbert"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-700 border border-blue-500/30 text-white p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        required
                    />
                </label>

                <label className="block mb-4 text-center">
                    <span className="text-gray-300 font-medium">Last Name</span>
                    <input
                        type="text"
                        placeholder="Bobbertson"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-700 border border-blue-500/30 text-white p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        required
                    />
                </label>

                <label className="block mb-6 text-center">
                    <span className="text-gray-300 font-medium">Date of Birth</span>
                    <input
                        type="date"
                        value={dateOfBirth}
                        placeholder="01/01/2025"
                        onChange={(e) => setDateofBirth(e.target.value)}
                        className="w-full bg-slate-700 border border-blue-500/30 text-white p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        required
                    />
                </label>

                <button
                    type="submit"
                    className="w-full bg-blue-600/20 text-blue-400 py-3 rounded-lg border border-blue-600/50 hover:bg-blue-600 hover:text-white font-bold transition-all"
                >
                    Register
                </button>
            </form>
        </div>
    )
}

export default Register
