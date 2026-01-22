import {Navigate, Outlet} from "react-router-dom";

export const PrivateRoute = ({authenticated}) => {
    if (authenticated == null) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
