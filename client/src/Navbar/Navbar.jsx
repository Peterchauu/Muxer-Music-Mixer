import React from 'react';
import { Link, useNavigate } from "react-router-dom"
import musicIcon from '../assets/music-Icon.svg'
import { useAuth } from '../context/AuthContext'; 

const Navbar = () => {
    const { currentUser, logout } = useAuth(); 
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/Sign In'); 
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    return (
        <nav className="bg-white shadow-md fixed w-full z-10 top-0 left-0">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <img src={musicIcon} className="h-8 w-8" alt="Music Icon" />
                
                <ul className="flex space-x-10">
                    <li><Link to="/" className="font-sans hover:text-blue-500">Music Mixer</Link></li>
                    <li><Link to="/Playlists" className="font-sans hover:text-blue-500">Playlists</Link></li>
                    <li><Link to="/About" className="font-sans hover:text-blue-500">About</Link></li>
                </ul>
                
                <div className="text-gray-700 space-x-5 flex items-center">
                    {/* Logic to swap buttons */}
                    {currentUser ? (
                        <>
                            {/* Optional: Show user's name */}
                            <span className="text-sm font-semibold hidden md:inline-block">
                                {currentUser.displayName || "User"}
                            </span>
                            <button 
                                onClick={handleLogout} 
                                className="hover:text-red-600 font-sans cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/Sign In" className="hover:text-blue-600">Sign In</Link>
                            <Link to="/Register" className="hover:text-red-600">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar