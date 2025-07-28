import { useNavigate } from "react-router-dom";

export const PrivateRoute = ({element, authenticated}) => {
    const navigate = useNavigate();
    if (!authenticated) {
        console.log(authenticated);
        console.log('navigating to login');
        navigate('/login');
    }

    return element;
}