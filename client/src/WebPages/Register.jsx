import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "../services/firebaseInit"
import { useNavigate } from "react-router-dom"
import { db } from "../services/firebaseInit"
import { doc, setDoc } from "firebase/firestore"

// Requirement 2 fulfilled

function Register () {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [dateOfBirth, setDateofBirth] = useState("")

    const navigate = useNavigate()

    // Register page with the input form fields that allow creation of a new user account with their information
    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)

            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`,
            })

            // will fix later, cant store data atm
            // await setDoc(doc(db, "Users", userCredential.user.uid), { firstName, lastName, dateOfBirth, email })

            console.log("User registered: ", userCredential.user)
            // navigate to sign-in or account page if you want
            // navigate("/signin")
        } catch (err) {
            console.error("Error signing in: ", err.message)
            setError(err.message)
        }

        console.log("Registration attempt with: ", { email, password, firstName, lastName, dateOfBirth })
    }

    {/* Requirement 4 fulfilled (2/2) */}

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80 border-2">
                {error && (
                    <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
                )}
                <label className="block mb-2 text-center"></label>
                <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

                <label className=" block mb-2 text-center">
                    Email
                    <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border p-2 round mt-1"
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
                        className="w-full border p-2 round mt-1"
                        required
                    />
                </label>

                <label className="block mb-4 text-center">
                    First Name
                    <input
                        type="text"
                        placeholder="Bobbert"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full border p-2 round mt-1"
                        required
                    />
                </label>

                <label className="block mb-4 text-center">
                    Last Name
                    <input
                        type="text"
                        placeholder="Bobbertson"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full border p-2 round mt-1"
                        required
                    />
                </label>

                <label className="block mb-4 text-center">
                    Date of Birth
                    <input
                        type="date"
                        value={dateOfBirth}
                        placeholder="01/01/2025"
                        onChange={(e) => setDateofBirth(e.target.value)}
                        className="w-full border p-2 round mt-1"
                        required
                    />
                </label>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                    Register
                </button>
            </form>
        </div>
    )
}

export default Register
