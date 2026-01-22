import React, { useState } from 'react';
import Cookies from "js-cookie";
import {useNavigate} from "react-router-dom";
import {useMutation} from "@tanstack/react-query";

import {login} from "../../api.jsx";
import {getStatus} from "../../util.jsx";
import {showSuccess, showError} from "../../utils/toast.js";

import './css/login.css';

export const LoginPage = ({setAuthenticated}) =>  {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmitClick = async () => {
        loginMutation.mutate({ email, password });
    }

    const loginMutation = useMutation({
        mutationFn: ({ email, password }) => login(email, password),
        onSuccess: (data) => {
            Cookies.set('access_token', data.token);
            setAuthenticated(true);
            showSuccess('Welcome back!');
            navigate('/dashboard');
        },
        onError: (error) => {
            if (getStatus(error) === 401) {
                showError('Login failed. Please check your credentials.');
                navigate('/login');
                return;
            }
            showError('Login failed. Please check your credentials.');
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
              <button className="loginSubmit" type="submit" onClick={handleSubmitClick}>Login</button>
              <p className="loginFootnote">Use your existing credentials to continue.</p>
          </div>
      </div>
    );
}
