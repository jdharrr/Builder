import React, { useState } from 'react';
import Cookies from "js-cookie";
import {useNavigate} from "react-router-dom";

import {login} from "../../api.jsx";

import './css/login.css';

export const LoginPage = ({setAuthenticated}) =>  {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmitClick = async () => {
        try {
            const data = await login(username, password);
            Cookies.set('access_token', data.token);
            setAuthenticated(true);
            navigate('/dashboard');
        } catch (err) {
            alert(err.message);
        }
    }

    return (
      <div className="loginWrapper">
          <h1>Login</h1>
          <div className="loginForm">
              <input className='loginInput' type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
              <input className='loginInput' type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="loginSubmit" type="submit" onClick={handleSubmitClick}>Login</button>
      </div>
    );
}