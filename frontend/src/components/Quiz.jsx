import React, { useContext, useState, useEffect } from 'react';
import { QuizContext } from '../context/QuizContext';

function Quiz() {
    const { quizQuestions, loading, error } = useContext(QuizContext);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showExplanation, setShowExplanation] = useState({});
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);

    console.log("Quiz Questions in Quiz Component:", quizQuestions); // Debugging

    const totalQuestions = quizQuestions ? 
        Object.values(quizQuestions).reduce((acc, section) => acc + Object.keys(section).length, 0) : 0;

    useEffect(() => {
        const correctAnswers = Object.entries(selectedAnswers).filter(([uniqueId, selected]) => {
            const [sectionId, questionId] = uniqueId.split('_');
            return selected === quizQuestions[sectionId][questionId].answer;
        }).length;

        setScore(correctAnswers);

        if (Object.keys(selectedAnswers).length === totalQuestions) {
            setShowScore(true);
        }
    }, [selectedAnswers, quizQuestions, totalQuestions]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!quizQuestions || !Object.keys(quizQuestions).length) {
        return <div>No questions available.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Interactive Quiz
          </h1>
          
          {showScore && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
                Quiz Complete!
              </h2>
              <div className="text-center">
                <p className="text-xl text-blue-700">
                  Your Score: {score} / {totalQuestions}
                </p>
                <p className="text-lg text-blue-600 mt-2">
                  {(score / totalQuestions * 100).toFixed(1)}% Correct
                </p>
              </div>
            </div>
          )}

          {Object.entries(quizQuestions).map(([sectionId, section]) => (
            <div key={sectionId} className="mb-8">
              {Object.entries(section).map(([questionId, question]) => {
                const uniqueId = `${sectionId}_${questionId}`;
                return (
                  <div key={uniqueId} 
                       className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      {question.question}
                    </h2>
                    <div className="space-y-3">
                      {['opt1', 'opt2', 'opt3', 'opt4'].map((optKey) => (
                        <button
                          key={`${uniqueId}_${optKey}`}
                          onClick={() => handleAnswerSelect(sectionId, questionId, optKey)}
                          disabled={selectedAnswers[uniqueId]}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all
                            ${selectedAnswers[uniqueId] === optKey 
                              ? optKey === question.answer
                                ? 'bg-green-50 border-green-500 text-green-700 font-medium'
                                : 'bg-red-50 border-red-500 text-red-700 font-medium'
                              : selectedAnswers[uniqueId]
                                ? 'bg-gray-50 border-gray-200 text-gray-500'
                                : 'hover:bg-gray-50 hover:border-blue-300 border-gray-200 text-gray-700'
                            } ${!selectedAnswers[uniqueId] && 'hover:scale-[1.01]'}`}
                        >
                          {question[optKey]}
                        </button>
                      ))}
                    </div>
                    {showExplanation[uniqueId] && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className={`font-medium mb-2 ${
                          selectedAnswers[uniqueId] === question.answer
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {selectedAnswers[uniqueId] === question.answer
                            ? '✓ Correct Answer!'
                            : `✗ Incorrect - The correct answer was: ${question[question.answer]}`}
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
    );
}

export default Quiz;