import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom"
import musicMuxerLogo from '../assets/music_muxere_png.png'
import { useAuth } from '../context/AuthContext'; 

const Navbar = () => {
    const { currentUser, logout } = useAuth(); 
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollDifference = currentScrollY - lastScrollY;
            
            // Show navbar when scrolling up, hide when scrolling down
            // Buffer: must scroll up more than 20px to show, down more than 20px to hide
            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (scrollDifference < -20) {
                setIsVisible(true);
            } else if (scrollDifference > 20 && currentScrollY > 80) {
                setIsVisible(false);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/Sign In'); 
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    return (
        <nav className={`bg-blue-950 fixed w-full z-50 left-0 transition-all duration-300 ${
            isVisible ? 'top-0 opacity-100' : '-top-20 opacity-0'
        }`}>
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <img src={musicMuxerLogo} className="h-10" alt="Music Muxer Logo" />
                
                <ul className="flex space-x-16">
                    <li><Link to="/" className="font-mono font-bold text-lg text-gray-300 hover:text-blue-400 transition-colors duration-200 tracking-wide px-6 py-3 rounded-lg hover:bg-blue-950/50">Music Mixer</Link></li>
                    <li><Link to="/Playlists" className="font-mono font-bold text-lg text-gray-300 hover:text-blue-400 transition-colors duration-200 tracking-wide px-6 py-3 rounded-lg hover:bg-blue-950/50">Playlists</Link></li>
                    <li><Link to="/About" className="font-mono font-bold text-lg text-gray-300 hover:text-blue-400 transition-colors duration-200 tracking-wide px-6 py-3 rounded-lg hover:bg-blue-950/50">About</Link></li>
                </ul>
                
                <div className="text-gray-300 space-x-5 flex items-center">
                    {/* Logic to swap buttons */}
                    {currentUser ? (
                        <>
                            {/* Optional: Show user's name */}
                            <span className="text-sm font-semibold hidden md:inline-block text-blue-400">
                                {currentUser.displayName || "User"}
                            </span>
                            <button 
                                onClick={handleLogout} 
                                className="hover:text-red-400 font-sans cursor-pointer transition-colors duration-200"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/Sign In" className="hover:text-blue-400 transition-colors duration-200">Sign In</Link>
                            <Link to="/Register" className="bg-blue-600/20 text-blue-400 px-8 py-3 rounded-lg border border-blue-600/50 hover:bg-blue-600 hover:text-white font-bold transition-all">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar