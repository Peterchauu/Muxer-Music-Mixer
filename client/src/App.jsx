import { useState } from 'react'
import React from 'react'
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar/Navbar.jsx'
import MusicBar from './MusicBar/MusicBar.jsx'
import { AudioProvider } from './context/AudioContext';
import MusicMixer from './WebPages/MusicMixer.jsx'
import About from './WebPages/About.jsx'
import SignIn from './WebPages/SignIn.jsx'
import Register from './WebPages/Register.jsx'

function App() {
  return (
    <AudioProvider>
          <Navbar />
          <MusicBar />
    </AudioProvider>
  )
}

export default App
