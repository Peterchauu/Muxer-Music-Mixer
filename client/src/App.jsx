import { useState } from 'react'
import React from 'react'
import Navbar from './Navbar/Navbar.jsx'
import MusicBar from './MusicBar/MusicBar.jsx'

function App() {
  const [isPlaying, setIsPlaying] = useState(true);
  
  return (
    <div className="flex flex-col min-h-screen">
      {isPlaying && <MusicBar />}
      <Navbar />
      <main className="flex-1">
      </main>
    </div>
  )
}

export default App
