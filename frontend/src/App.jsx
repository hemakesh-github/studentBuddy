import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import QuizForm from './components/QuizForm';
import Login from './components/Login';
import Register from './components/Register';
import Quiz from './components/Quiz';
import QuizViewer from './components/QuizViewer';
import DoubtViewer from './components/DoubtViewer';
import QuizContextProvider from './context/QuizContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Protected from './auth/Protected';
import DoubtSolver from './components/DoubtSolver';
import Profile from './components/Profile';


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
                    <Route path="/quiz/:quizId" element={
                        <Protected>
                            <Quiz />
                        </Protected>
                    } />
                    <Route path="/doubt-solver" element={
                        <Protected>
                            <DoubtSolver />
                        </Protected>
                    } />
                    <Route path="/doubt/:doubtId" element={
                        <Protected>
                            <DoubtSolver />
                        </Protected>
                    } />
                    <Route path="/profile" element={
                        <Protected>
                            <Profile />
                        </Protected>
                    } />
                    <Route path="/quiz-viewer/:quizId" element={
                        <Protected>
                            <QuizViewer />
                        </Protected>
                    } />
                    <Route path="/doubt-viewer/:doubtId" element={
                        <Protected>
                            <DoubtViewer />
                        </Protected>
                    } />
                </Routes>
            </QuizContextProvider>
        </BrowserRouter>
    );
}

export default App;
