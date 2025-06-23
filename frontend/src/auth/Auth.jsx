export const checkAuthenticated = () => {
    return sessionStorage.getItem('token') !== null;
}

export const setToken = (token) => {
    sessionStorage.setItem('token', token);
}

export const getToken = () => {
    return sessionStorage.getItem('token');
}

export const removeToken = () => {
    sessionStorage.removeItem('token');
}