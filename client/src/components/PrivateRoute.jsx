import { useNavigate } from "react-router-dom";

export const PrivateRoute = ({element, authenticated}) => {
    const navigate = useNavigate();
    if (!authenticated) {
        navigate('/login');
    }

    return element;
}