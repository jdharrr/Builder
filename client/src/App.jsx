import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Dashboard } from './pages/Dashboard/dashboard.jsx';
import {Login} from "./pages/Login/login.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import { validateToken } from "./api.jsx";

const App = () => {
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        setAuthenticated(validateToken());
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    exact path="/"
                    element={
                        <PrivateRoute
                            authenticated={authenticated}
                            element={<Dashboard />}
                        />
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;