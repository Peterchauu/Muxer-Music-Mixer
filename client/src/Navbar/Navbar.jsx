import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import About from "../WebPages/About.jsx"
import MusicMixer from "../WebPages/MusicMixer.jsx"
import SignIn from "../WebPages/SignIn.jsx"
import Register from "../WebPages/Register.jsx"
import musicIcon from '../assets/music-Icon.svg'

const Navbar = () => {
    return (
        <Router>
            <nav className="bg-white shadow-md fixed w-full z-10 top-0 left-0">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <img src={musicIcon} className=" h-8 w-8"></img>
                    <div>
                        <a href="#" className="font-semibold font-mono">
                        <ul className="flex space-x-10">
                            <li><Link to="/" className="font-sans hover:text-blue-500" href="#home">Music Mixer</Link></li>
                            <li><Link to="/About" className="font-sans hover:text-blue-500" href="#pg1">About</Link></li>
                        </ul>
                    </a>
                    </div>
                    <ul className=" text-gray-700">
                    <li className= "space-x-5">
                        <Link to="/Sign In" href="#SignIn" className="hover:text-blue-600">Sign In
                        </Link>
                        <Link to="/Register" href="#Register" className="hover:text-red-600">Register
                        </Link>
                    </li>
                </ul>
                </div>
            </nav>
            <Routes>
                <Route path="/" element={<MusicMixer/>}/>
                <Route path="/About" element={<About/>}/>
                <Route path="/Sign In" element={<SignIn/>}/>
                <Route path="/Register" element={<Register/>}/>
            </Routes>
        </Router>
    )
}

export default Navbar