import React, {useContext, useEffect, useState} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";

import { Dashboard } from './pages/dashboard/dashboard.jsx';
import {Login} from "./pages/login/login.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import {fetchUser, validateToken} from "./api.jsx";
import {DashboardContextProvider} from "./pages/dashboard/providers/dashboardContextProvider.jsx";
import {TotalsPage} from "./pages/totals/totalsPage.jsx";
import {BuilderLayout} from "./layouts/BuilderLayout.jsx";
import {UserContext} from "./providers/user/userContext.jsx";

const App = () => {
    const {setUser} = useContext(UserContext);
    const [authenticated, setAuthenticated] = useState(null);

    useEffect(() => {
        async function validate() {
            const isValidated = await validateToken();
            setAuthenticated(isValidated);
        }

        validate();
        document.cookie = "XDEBUG_SESSION=PHPSTORM; path=/";
    }, []);

    useEffect(() => {
        async function loadUser() {
            try {
                const user = await fetchUser();
                setUser(user);
            } catch{ /* empty */ }
        }

        if (!authenticated) return;

        loadUser();
    }, [authenticated, setUser])

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login"
                    element={
                        <Login setAuthenticated={setAuthenticated} />
                    }
                />
                <Route
                    exact path="/dashboard"
                    element={
                        <DashboardContextProvider>
                            <PrivateRoute authenticated={authenticated} >
                                <BuilderLayout>
                                    <Dashboard />
                                </BuilderLayout>
                            </PrivateRoute>
                        </DashboardContextProvider>
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
    );
}

export default App;