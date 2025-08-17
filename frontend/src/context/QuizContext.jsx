import React, { createContext, useState } from 'react'

export const QuizContext = createContext();

function QuizContextProvider({ children }) {
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentQuizId, setCurrentQuizId] = useState(null);
    const [quizMetadata, setQuizMetadata] = useState(null);
    
  return (
    <QuizContext.Provider value={{ 
      quizQuestions, setQuizQuestions, 
      loading, setLoading, 
      error, setError,
      currentQuizId, setCurrentQuizId,
      quizMetadata, setQuizMetadata
    }}>
      {children}
    </QuizContext.Provider>
  )
}

export default QuizContextProvider