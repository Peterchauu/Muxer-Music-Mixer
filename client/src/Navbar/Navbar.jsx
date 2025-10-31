import React from 'react';
import { Link } from "react-router-dom"
import musicIcon from '../assets/music-Icon.svg'

const Navbar = () => {
    return (
        <nav className="bg-white shadow-md fixed w-full z-10 top-0 left-0">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <img src={musicIcon} className="h-8 w-8" alt="Music Icon" />
                
                <ul className="flex space-x-10">
                    <li><Link to="/" className="font-sans hover:text-blue-500">Music Mixer</Link></li>
                    <li><Link to="/Playlists" className="font-sans hover:text-blue-500">Playlists</Link></li>
                    <li><Link to="/About" className="font-sans hover:text-blue-500">About</Link></li>
                </ul>
                
                <div className="text-gray-700 space-x-5">
                    <Link to="/Sign In" className="hover:text-blue-600">Sign In</Link>
                    <Link to="/Register" className="hover:text-red-600">Register</Link>
                </div>
            </div>
        </nav>
    )
}

export default Navbar