import { useState } from 'react';


// Volume Control with slider bar
function SoundBar() {
  const [volume, setVolume] = useState(100); 

  return (
    <div className='fixed bottom-10 right-25 items-center justify-center'>
      <label htmlFor='volume' className='text-gray-500 font-medium'>
        Volume: {volume}%
      </label>

      <input
        id='volume'
        type='range'
        min='0'
        max='100'
        value={volume}
        onChange={(e) => setVolume(e.target.value)}
        className='w-55 h-2 bg-white rounded-lg appearance-none cursor-pointer accent-blue-500'
      />
    </div>
  );
}

export default SoundBar