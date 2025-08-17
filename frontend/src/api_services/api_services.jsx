
import axios from 'axios';
import { getToken } from '../auth/Auth';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://studentbuddy-swpo.onrender.com';

export const performLogin = async (formData) => {
    const response = await axios.post(`${BASE_URL}/login`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

    return response.data;
}

export const performRegister = async (data) => {
    const response = await axios.post(`${BASE_URL}/users/`, data, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
}

export const generateQuiz = async (file) => {
    try {
        const token = getToken(); // Assuming getToken is a function that retrieves the token from storage
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('questions_per_section', 3); // Optional: adjust as needed

        const response = await axios.post(`${BASE_URL}/api/generate-quiz`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error generating quiz:', error);
        
        // Handle 401 unauthorized - redirect to login
        if (error.response?.status === 401) {
            console.log('Authentication failed, redirecting to login...');
            localStorage.removeItem('token'); // Clear invalid token
            window.location.href = '/login'; // Redirect to login page
        }
        
        return null;
    }
}

export const solveDoubt = async ({ question, pdf, image, subjects, conversation }) => {
    
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        console.log('Sending request with token:', token ? 'Token present' : 'No token');

        const formData = new FormData();
        if (question) formData.append('question', question);
        if (pdf) formData.append('context_pdf', pdf);
        if (image) formData.append('context_image', image);
        if (subjects && subjects.length > 0) formData.append('subjects', subjects.join(','));
        if (conversation) formData.append('conversation', JSON.stringify(conversation));

        const response = await axios.post(`${BASE_URL}/api/solve-doubt`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error solving doubt:', error);
        
        // Handle 401 unauthorized - redirect to login
        if (error.response?.status === 401) {
            console.log('Authentication failed, redirecting to login...');
            localStorage.removeItem('token'); // Clear invalid token
            window.location.href = '/login'; // Redirect to login page
            return { error: 'Authentication expired. Please login again.' };
        }
        
        return { error: error.message };
    }
};

// Profile and History APIs
export const getUserProfile = async () => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get(`${BASE_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        throw error;
    }
};

export const getQuizHistory = async (skip = 0, limit = 20) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get(`${BASE_URL}/api/quiz-history?skip=${skip}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching quiz history:', error);
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        throw error;
    }
};

export const getDoubtHistory = async (skip = 0, limit = 20, subject = null) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        let url = `${BASE_URL}/api/doubt-history?skip=${skip}&limit=${limit}`;
        if (subject) {
            url += `&subject=${encodeURIComponent(subject)}`;
        }

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching doubt history:', error);
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        throw error;
    }
};

export const submitQuizAttempt = async (attemptData) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios.post(`${BASE_URL}/api/submit-quiz-attempt`, attemptData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error submitting quiz attempt:', error);
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        throw error;
    }
};


export const getDoubtById = async (doubtId) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get(`${BASE_URL}/api/doubt/${doubtId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching doubt by id:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw error;
    }
};

export const getQuizById = async (quizId) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get(`${BASE_URL}/api/quiz/${quizId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching quiz by id:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw error;
    }
};

export const downloadFile = async (quizId, filename) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${BASE_URL}/api/download-file/${quizId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return { success: true };
        } else {
            throw new Error('Failed to download file');
        }
    } catch (error) {
        console.error('Download error:', error);
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        throw error;
    }
};