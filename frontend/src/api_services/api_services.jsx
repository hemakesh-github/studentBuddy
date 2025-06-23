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

export const performRegister = async (formData) => {
    const response = await axios.post(`${API_URL}/register`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
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

        return response.data.data;
    } catch (error) {
        console.error('Error generating quiz:', error);
        return null;
    }
}
