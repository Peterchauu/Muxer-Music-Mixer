import { useState } from "react"


// Requirement 2 fulfilled

function Register () {
    const [email, setEmail] = useState("")
    const [password,setPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [dateOfBirth, setDateofBirth] = useState("")
    

    // Register page with the input form fields that allow creation of a new user account with their information
    const handleSubmit = (e) => {
        e.preventDefault()
        console.log("Registration attempt with: ", {email, password, firstName, lastName, dateOfBirth, gender})
    }


    {/* Requirement 4 fulfilled (2/2) */}

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80 border-2">
                <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
                <label className=" block mb-2 text-center">
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded mt-1" required>
                    </input>
                </label>
                <label className="block mb-4 text-center">
                    Password
                    <input type="password" value= {password} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 round mt-1" required>
                    </input>
                </label>
                <label className="block mb-6 text-center">
                    First Name
                    <input type="first name text-center" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border p-2 round mt-1" required>
                    </input>
                </label>
                <label className="block mb-8 text-center">
                    Last Name
                    <input type="last name text-center" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border p-2 round mt-1" required>
                    </input>
                </label>
                <label className="block mb-10 text-center">
                    Date of Birth
                    <input type="date of birth" value={dateOfBirth} onChange={(e)=>setDateofBirth(e.target.value)} className="w-full border p-2 round mt-1 required:">
                    </input>
                </label>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                    Register
                </button>
            </form>

        </div>
    )
}

export default Register