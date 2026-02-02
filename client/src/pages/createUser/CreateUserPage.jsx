import React, {useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation} from "@tanstack/react-query";

import {createUser} from "../../api.jsx";
import {getStatus} from "../../util.jsx";
import {showError, showSuccess} from "../../utils/toast.js";

import './css/createUser.css';

export default function CreateUserPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const createUserMutation = useMutation({
        mutationFn: ({username, email, password}) => createUser(username, email, password),
        onSuccess: () => {
            showSuccess('Account created. You can sign in now.');
            navigate('/login');
        },
        onError: (error) => {
            if (getStatus(error) === 400) {
                const message = error?.response?.data;
                showError(typeof message === 'string' ? message : 'Unable to create account.');
                return;
            }
            showError('Unable to create account.');
        }
    });

    const handleSubmit = () => {
        createUserMutation.mutate({username, email, password});
    };

    return (
        <div className="createUserWrapper">
            <div className="createUserCard">
                <div className="createUserHeader">
                    <span className="createUserEyebrow">Get Started</span>
                    <h1 className="createUserTitle">Create account</h1>
                    <p className="createUserSubtitle">Set up your account to start tracking budgets and expenses.</p>
                </div>
                <div className="createUserForm">
                    <label className="createUserLabel" htmlFor="createUserName">Username</label>
                    <input
                        id="createUserName"
                        className="createUserInput"
                        type="text"
                        placeholder="your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <label className="createUserLabel" htmlFor="createUserEmail">Email</label>
                    <input
                        id="createUserEmail"
                        className="createUserInput"
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label className="createUserLabel" htmlFor="createUserPassword">Password</label>
                    <input
                        id="createUserPassword"
                        className="createUserInput"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button className="createUserSubmit" type="button" onClick={handleSubmit}>
                    Create Account
                </button>
                <p className="createUserFootnote">
                    Already have an account? <button type="button" className="createUserLink" onClick={() => navigate('/login')}>Sign in</button>
                </p>
            </div>
        </div>
    );
}
