import React, { useState } from 'react'

function HomePage() {
  const [currentPage, setCurrentPage] = useState(1)
  const cardsPerPage = 20
  const totalCards = 100 
  
  const generatePlaceholderCards = () => {
    return Array.from({ length: cardsPerPage }, (_, index) => ({
      id: index + 1 + (currentPage - 1) * cardsPerPage,
      title: `Song ${index + 1 + (currentPage - 1) * cardsPerPage}`,
      artist: `Artist ${index + 1 + (currentPage - 1) * cardsPerPage}`,
      duration: '3:30',
      genre: 'Pop'
    }))
  }

  const totalPages = Math.ceil(totalCards / cardsPerPage)

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-[70vh] bg-gray-100">
        {/*mixer module */}
      </div>

      {/*song grid*/}
      <div className="min-h-[50vh] flex flex-col bg-gray-50">
        <div className="p-6 bg-white border-b">
          <h2 className="text-2xl font-bold">Track list</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-5 gap-6 mb-8">
            {generatePlaceholderCards().map(card => (
              <div 
                key={card.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 flex flex-col"
              >
                <div className="w-full aspect-square bg-gray-200 rounded-md mb-3">
                </div>
                <h3 className="font-semibold truncate">{card.title}</h3>
                <p className="text-sm text-gray-600 truncate mb-2">{card.artist}</p>
                <div className="mt-auto flex justify-between text-xs text-gray-500">
                  <span>{card.duration}</span>
                  <span>{card.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 p-4 border-t bg-white/90 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-black rounded hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-black rounded hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage