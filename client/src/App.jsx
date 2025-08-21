import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";

import { Dashboard } from './pages/dashboard/dashboard.jsx';
import {Login} from "./pages/login/login.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import { validateToken } from "./api.jsx";
import {ContextProvider} from "./pages/dashboard/providers/contextProvider.jsx";
import {TotalsPage} from "./pages/totals/totalsPage.jsx";
import {BuilderLayout} from "./layouts/BuilderLayout.jsx";

const App = () => {
    const [authenticated, setAuthenticated] = useState(null);

    useEffect(() => {
        async function validate() {
            const isValidated = await validateToken();
            setAuthenticated(isValidated);
        }

        validate();
        document.cookie = "XDEBUG_SESSION=PHPSTORM; path=/";
    }, []);

    console.log(authenticated);

    return (
        <ContextProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login"
                        element={
                            <Login />
                        }
                    />
                    <Route
                        exact path="/dashboard"
                        element={
                            <PrivateRoute authenticated={authenticated} >
                                <BuilderLayout>
                                    <Dashboard />
                                </BuilderLayout>
                            </PrivateRoute>
                        }
                    />
                    <Route path="/totals"
                        element={
                            <PrivateRoute authenticated={authenticated} >
                                <BuilderLayout>
                                    <TotalsPage />
                                </BuilderLayout>
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </ContextProvider>
    );
}

export default App;