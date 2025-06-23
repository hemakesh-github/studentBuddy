import React, { useEffect } from 'react'
import { checkAuthenticated } from './Auth'
import Login from '../components/Login';

const Protected = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    useEffect(() => {
        const fetchStatus = async () => {
            const status = await checkAuthenticated();
            if (status) {
                setIsAuthenticated(true);
            }
        }
        fetchStatus();
    }, [])
    console.log(isAuthenticated);
    return (
        <>
            {isAuthenticated ? children: <Login />}
        </>
    ) 
}

export default Protected