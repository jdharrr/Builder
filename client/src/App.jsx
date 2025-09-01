import React, {lazy, Suspense, useContext, useEffect, useState} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {LoginPage} from "./pages/login/LoginPage.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import {fetchUser, validateToken} from "./api.jsx";
import {BuilderLayout} from "./layouts/BuilderLayout.jsx";
import {UserContext} from "./providers/user/UserContext.jsx";

import './css/app.css';

const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage.jsx"));
const ExpensesPage = lazy(() => import("./pages/expenses/ExpensesPage.jsx"));
const TotalsPage = lazy(() => import('./pages/totals/TotalsPage.jsx'));

const App = () => {
    const queryClient = new QueryClient();

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
            <QueryClientProvider client={queryClient}>
                <div className="app min-vh-100">
                    <Suspense fallback={<div>Loading...</div>}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/login"
                                element={
                                    <LoginPage setAuthenticated={setAuthenticated} />
                                }
                            />
                            <Route
                                exact path="/dashboard"
                                element={
                                    <PrivateRoute authenticated={authenticated} >
                                        <BuilderLayout>
                                            <DashboardPage />
                                        </BuilderLayout>
                                    </PrivateRoute>
                                }
                            />
                            <Route path="/expenses"
                                element={
                                    <PrivateRoute authenticated={authenticated} >
                                        <BuilderLayout>
                                            <ExpensesPage />
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
                    </Suspense>
                </div>
            </QueryClientProvider>
        </Router>
    );
}

export default App;