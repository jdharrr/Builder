import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Dashboard } from './pages/Dashboard/dashboard.jsx';
import {Login} from "./pages/Login/login.jsx";
import Cookies from "js-cookie";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import axios from "axios";

const App = () => {
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const token = Cookies.get('access_token');
        if (!token) {
            setAuthenticated(false);
        } else {
            try {
                const _ = axios.get('http://localhost:8000/api/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': "application/json",
                        'Content-Type': 'application/json'
                    }
                });

                setAuthenticated(true);
            } catch {
                setAuthenticated(false);
            }
        }
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
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