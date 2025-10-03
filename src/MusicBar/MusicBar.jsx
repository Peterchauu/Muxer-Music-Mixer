import { useState } from 'react'
import tempIcon from '../assets/not-like-us.jpg'
import reverseIcon from '../assets/backward-solid-full.svg'
import playIcon from '../assets/play-solid-full.svg'
import forwardIcon from '../assets/forward-solid-full.svg'
import SoundBar from '../SoundBar/SoundBar'

const MusicBar = () => {
    const [songTitle,getSongTitle] = useState("Filler Song")
    const [artistName,getArtistName] = useState("Filler Name")

    return (
        <section className=" bg-black fixed w-full z-10 bottom-0 left-0">
            <div className="max-w-8xl mx-auto px-2 py-1 flex items-center">
                <img src={tempIcon} className='h-25 w-25 p-1'>
                </img>
                <ul className='px-4'>
                    <li className='text-white'>{songTitle}</li>
                    <li className='text-gray-400'>{artistName}</li>
                </ul>
            <div className='mx-145 space-x-4'>
                    <button className='h-10 w-10'>
                        <img className='invert' src={reverseIcon}></img>
                    </button>
                    <button className='h-10 w-10'>
                        <img className=' invert' src={playIcon}></img>
                    </button>
                    <button className='h-10 w-10'>
                        <img className='invert' src={forwardIcon}></img>
                    </button>
                </div>
            </div>
            <div className='bottom-0 right-0'>
                <SoundBar/>
            </div>
        </section> 
    )
}

export default MusicBar