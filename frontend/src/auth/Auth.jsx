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

export const isLoggedIn = () => {
    return sessionStorage.getItem('token') !== null;
}
export const onLogin = () => {
    window.location.href = '/login';
}
export const onLogout = () => {
    removeToken();
    window.location.href = '/';
}