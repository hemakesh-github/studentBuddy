import axios from 'axios';
import { getToken } from '../auth/Auth';
const BASE_URL = 'http://localhost:8000';

export const performLogin = async (formData) => {
    const response = await axios.post('http://localhost:8000/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

    return response.data;
}

export const performRegister = async (data) => {
    const response = await axios.post('http://localhost:8000/users/', data, {
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
        return null;
    }
}

export const solveDoubt = async ({ question, pdf, subjects, conversation }) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const formData = new FormData();
        if (question) formData.append('question', question);
        if (pdf) formData.append('context_pdf', pdf);
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
        return { error: error.message };
    }
};
