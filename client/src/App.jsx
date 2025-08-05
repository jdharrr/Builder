import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Dashboard } from './pages/dashboard/dashboard.jsx';
import {Login} from "./pages/login/login.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import { validateToken } from "./api.jsx";
import {ContextProvider} from "./pages/dashboard/providers/contextProvider.jsx";

const App = () => {
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        setAuthenticated(validateToken());
    }, []);

    return (
        <ContextProvider>
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
        </ContextProvider>
    );
}

export default App;