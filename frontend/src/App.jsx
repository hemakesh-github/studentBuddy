import { useState, useContext } from 'react'

import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Quiz from './components/Quiz'
import QuizContextProvider from './context/QuizContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <QuizContextProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </QuizContextProvider>
    </BrowserRouter>
  )
}

export default App
