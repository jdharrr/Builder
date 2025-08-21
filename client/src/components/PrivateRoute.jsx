import { useNavigate } from "react-router-dom";
import {useEffect} from "react";

export const PrivateRoute = ({children, authenticated}) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (authenticated === null) {
            return;
        }

        if (!authenticated) {
            navigate('/login');
        }
    }, [navigate, authenticated]);

    return (
        <>
            {children}
        </>
    );
}