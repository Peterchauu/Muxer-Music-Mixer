import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar/Navbar.jsx'
import MusicBar from './MusicBar/MusicBar.jsx'
import MusicMixer from './WebPages/MusicMixer.jsx'
import About from './WebPages/About.jsx'
import SignIn from './WebPages/SignIn.jsx'
import Register from './WebPages/Register.jsx'
import Playlists from './WebPages/Playlists.jsx'

function App() {
  return (
    <>
      <Navbar />
      <Routes>

        {/* Requirement 1 fulfilled */}
        <Route path="/" element={<MusicMixer/>}/>
        <Route path="/Playlists" element={<Playlists/>}/>
        <Route path="/About" element={<About/>}/>
        <Route path="/Sign In" element={<SignIn/>}/>
        <Route path="/Register" element={<Register/>}/>
      </Routes>
      <MusicBar />
    </>
  )
}

export default App
