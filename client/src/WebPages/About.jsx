function About() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white pt-16">
            <div className="max-w-2xl mx-auto p-8 text-center">
                <h1 className="text-4xl font-bold mb-6 text-blue-400 tracking-wider">ABOUT MUXER MUSIC MIXER</h1>
                <p className="text-lg text-gray-300 leading-relaxed">
                    Muxer Music Mixer is a modern web application that allows you to discover, 
                    organize, and enjoy your favorite music. Create custom playlists, explore 
                    new tracks, and experience seamless music streaming with our intuitive interface.
                </p>
                <div className="mt-8 p-6 bg-slate-800 rounded-xl border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <h2 className="text-xl font-semibold mb-4 text-blue-400">Features</h2>
                    <ul className="text-left space-y-2 text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>Advanced stem separation with Demucs</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>BPM synchronization with RubberBand</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>Real-time mixing with dual deck interface</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>Custom playlist creation and management</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default About