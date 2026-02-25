import React, { useState } from 'react';
import Cookies from "js-cookie";
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient} from "@tanstack/react-query";

import {fetchUser, login, payScheduledPayments} from "../../api.jsx";
import {showApiErrorToast, getStatus} from "../../util.jsx";
import {showSuccess} from "../../utils/toast.js";
import {invalidateExpenseCaches, invalidatePaymentCaches, invalidateTotalsCaches} from "../../utils/queryInvalidations.js";

import './css/login.css';

export const LoginPage = ({setAuthenticated}) =>  {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmitClick = async () => {
        loginMutation.mutate({ email, password });
    }

    const loginMutation = useMutation({
        mutationFn: ({ email, password }) => login(email, password),
        onSuccess: async (data) => {
            Cookies.set('access_token', data.token);
            try {
                await qc.fetchQuery({
                    queryKey: ['user'],
                    queryFn: fetchUser,
                    staleTime: 60_000,
                });
            } catch (error) {
                showApiErrorToast(error, 'Failed to load profile.');
            }
            setAuthenticated(true);
            try {
                await payScheduledPayments();
                invalidateExpenseCaches(qc);
                invalidatePaymentCaches(qc);
                invalidateTotalsCaches(qc);
                qc.invalidateQueries({ queryKey: ['creditCards'] });
            } catch (error) {
                showApiErrorToast(error, 'Automatic payments could not be processed.');
            }
            showSuccess('Welcome back!');
            navigate('/dashboard');
        },
        onError: (error) => {
            if (getStatus(error) === 401) {
                showApiErrorToast(error, 'Login failed. Please check your credentials.');
                navigate('/login');
                return;
            }
            showApiErrorToast(error, 'Login failed. Please check your credentials.');
        }
    });

    return (
      <div className="loginWrapper">
          <div className="loginCard">
              <div className="loginHeader">
                  <span className="loginEyebrow">Welcome back</span>
                  <h1 className="loginTitle">Sign in</h1>
                  <p className="loginSubtitle">Track expenses with a clean view of what is due and what is paid.</p>
              </div>
              <div className="loginForm">
                  <label className="loginLabel" htmlFor="loginEmail">Email</label>
                  <input
                      id="loginEmail"
                      className='loginInput'
                      type="email"
                      placeholder="you@email.com"
                      onChange={(e) => setEmail(e.target.value)}
                  />
                  <label className="loginLabel" htmlFor="loginPassword">Password</label>
                  <input
                      id="loginPassword"
                      className='loginInput'
                      type="password"
                      placeholder="••••••••"
                      onChange={(e) => setPassword(e.target.value)}
                  />
              </div>
              <button className="loginSubmit" type="submit" onClick={handleSubmitClick} disabled={loginMutation.isPending}>
                  Login
              </button>
              <p className="loginFootnote">
                  Need an account? <button type="button" className="loginLinkButton" onClick={() => navigate('/create-user')}>Create one</button>
              </p>
          </div>
      </div>
    );
}
