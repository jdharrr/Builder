import {Navigate, Outlet} from "react-router-dom";

export const PrivateRoute = ({authenticated}) => {
    if (authenticated == null) return;

    return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}