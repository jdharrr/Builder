import React, {lazy, Suspense, useEffect, useState} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";

import {LoginPage} from "./pages/login/LoginPage.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import {fetchUser, validateToken} from "./api.jsx";
import {BuilderLayout} from "./layouts/BuilderLayout.jsx";

import './css/app.css';
import {getStatus} from "./util.jsx";

const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage.jsx"));
const ExpensesPage = lazy(() => import("./pages/expenses/ExpensesPage.jsx"));
const TotalsPage = lazy(() => import('./pages/totals/TotalsPage.jsx'));

export const BuilderApp = () => {
    const [authenticated, setAuthenticated] = useState(null);

    useEffect(() => {
        async function validate() {
            const isValidated = await validateToken();
            setAuthenticated(isValidated);
        }

        validate();
        document.cookie = "XDEBUG_SESSION=PHPSTORM; path=/";
    }, []);

    useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            return await fetchUser();
        },
        enabled: authenticated ?? false,
        staleTime: 60_000,
        throwOnError: false,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        }
    });

    return (
        <Router>
            <div className="app min-vh-100">
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/login"
                               element={
                                   <LoginPage setAuthenticated={setAuthenticated} />
                               }
                        />
                        <Route element={<PrivateRoute authenticated={authenticated} />} >
                            <Route
                                exact path="/dashboard"
                                element={
                                    <BuilderLayout>
                                        <DashboardPage />
                                    </BuilderLayout>
                                }
                            />
                            <Route path="/expenses"
                                   element={
                                       <BuilderLayout>
                                           <ExpensesPage />
                                       </BuilderLayout>
                                   }
                            />
                            <Route path="/totals"
                                   element={
                                       <BuilderLayout>
                                           <TotalsPage />
                                       </BuilderLayout>
                                   }
                            />
                        </Route>
                    </Routes>
                </Suspense>
            </div>
        </Router>
    );
}