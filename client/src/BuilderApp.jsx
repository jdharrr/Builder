import React, {lazy, Suspense, useEffect, useState} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";

import {LoginPage} from "./pages/login/LoginPage.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import {fetchUser, validateToken} from "./api.jsx";
import {BuilderLayout} from "./layouts/BuilderLayout.jsx";
import ExpensesPageSkeleton from "./pages/expenses/skeletons/ExpensesPageSkeleton.jsx";
import PaymentsPageSkeleton from "./pages/payments/skeletons/PaymentsPageSkeleton.jsx";

import './css/app.css';

const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage.jsx"));
const ExpensesPage = lazy(() => import("./pages/expenses/ExpensesPage.jsx"));
const BudgetsPage = lazy(() => import("./pages/budgets/BudgetsPage.jsx"));
const PaymentsPage = lazy(() => import("./pages/payments/PaymentsPage.jsx"));
const TotalsPage = lazy(() => import('./pages/totals/TotalsPage.jsx'));
const CreateUserPage = lazy(() => import("./pages/createUser/CreateUserPage.jsx"));

export const BuilderApp = () => {
    const [authenticated, setAuthenticated] = useState(null);

    useEffect(() => {
        async function validate() {
            const isValidated = await validateToken();
            const isPublicRoute = window.location.pathname === "/login" || window.location.pathname === "/create-user";
            if (!isValidated && !isPublicRoute) {
                window.location.assign('/login');
                return;
            }
            setAuthenticated(isValidated);
        }

        validate();
    }, []);

    useEffect(() => {
        document.cookie = "XDEBUG_SESSION=PHPSTORM; path=/";
    }, []);

    useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            return await fetchUser();
        },
        enabled: authenticated ?? false,
        staleTime: 60_000,
        retry: false
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
                        <Route path="/create-user"
                               element={
                                   <CreateUserPage />
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
                                           <Suspense fallback={<ExpensesPageSkeleton />}>
                                               <ExpensesPage />
                                           </Suspense>
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
                            <Route path="/budgets"
                                   element={
                                       <BuilderLayout>
                                           <BudgetsPage />
                                       </BuilderLayout>
                                   }
                            />
                            <Route path="/payments"
                                   element={
                                       <BuilderLayout>
                                           <Suspense fallback={<PaymentsPageSkeleton />}>
                                               <PaymentsPage />
                                           </Suspense>
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
