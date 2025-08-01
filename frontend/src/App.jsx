import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import QuizForm from './components/QuizForm';
import Login from './components/Login';
import Register from './components/Register';
import Quiz from './components/Quiz';
import QuizContextProvider from './context/QuizContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Protected from './auth/Protected';
import DoubtSolver from './components/DoubtSolver';


function App() {
    return (
        <BrowserRouter>
            <QuizContextProvider>
                <Navbar />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/createQuiz" element={
                        <Protected>
                            <QuizForm />
                        </Protected>
                    } />
                    <Route path="/quiz" element={
                        <Protected>
                            <Quiz />
                        </Protected>
                    } />
                    <Route path="/doubt-solver" element={
                        <Protected>
                            <DoubtSolver />
                        </Protected>
                    } />
                </Routes>
            </QuizContextProvider>
        </BrowserRouter>
    );
}

export default App;
