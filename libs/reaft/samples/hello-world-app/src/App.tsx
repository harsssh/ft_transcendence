import Reaft, { useState } from 'reaft'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center items-center gap-8 mb-8">
          <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
            <img 
              src="/vite.svg" 
              className="h-24 w-24 hover:animate-spin-slow transition-all duration-300" 
              alt="Vite logo" 
            />
          </a>
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
            <img 
              src="/src/assets/react.svg" 
              className="h-24 w-24 animate-spin-slow hover:animate-spin transition-all duration-300" 
              alt="React logo" 
            />
          </a>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-8">
          Vite + Reaft
        </h1>
        
        <div className="mb-8">
          <button 
            className="px-6 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg border border-transparent transition-colors duration-200 cursor-pointer"
            onClick={() => setCount(count + 1)}
          >
            count is {count}
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Edit <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">src/App.tsx</code> and save to test HMR
        </p>
        
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App