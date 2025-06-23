import React, { useContext, useEffect, useState } from 'react';
import { QuizContext } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';
import { generateQuiz } from '../api_services/api_services';
import { getToken } from '../auth/Auth';

function QuizForm() {
    const navigate = useNavigate();
    const { quizQuestions, setQuizQuestions, loading, setLoading, error, setError } = useContext(QuizContext);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleUpload = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        if (!selectedFile) {
            setError("Please select a file");
            setLoading(false);
            return;
        }

        // Check file size
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            setLoading(false);
            return;
        }

        try {
            const questions = await generateQuiz(selectedFile);
            if (questions) {
                console.log(questions)
                setQuizQuestions(questions.data);
                if (questions.warning) {
                    console.warn(questions.warning);
                }
                navigate('/quiz');
            } else {
                setError("Failed to generate quiz. Please try again.");
            }
        } catch (err) {
            if (err.response?.status === 408) {
                setError("Quiz generation timed out. Please try with a smaller document.");
            } else if (err.response?.status === 413) {
                setError("Document is too large. Please try with a smaller file.");
            } else {
                setError(err.message || "Error generating quiz");
            }
        } finally {
            setLoading(false);
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-6 py-8 sm:p-10">
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                                Generate Quiz
                            </h1>
                            <p className="text-gray-500 mb-8">
                                Upload your document and get an interactive quiz instantly
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Upload Document
                                </label>
                                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 
                                    ${selectedFile ? 'border-blue-400 bg-blue-50' : 'border-gray-300 border-dashed'} 
                                    rounded-lg transition-colors duration-200`}>
                                    <div className="space-y-1 text-center">
                                        {!selectedFile ? (
                                            <>
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className="flex text-sm text-gray-600">
                                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                        <span>Upload a file</span>
                                                        <input 
                                                            type="file" 
                                                            accept=".pdf,.doc,.docx"
                                                            onChange={handleFileChange}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    PDF, DOC up to 10MB
                                                </p>
                                            </>
                                        ) : (
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="flex-shrink-0 text-gray-400 hover:text-gray-500"
                                                >
                                                    <span className="sr-only">Remove file</span>
                                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent 
                                    text-base font-medium rounded-md text-white bg-blue-600 
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'} 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                    transition-colors duration-200`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating Quiz...
                                    </>
                                ) : 'Generate Quiz'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuizForm;