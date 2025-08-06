import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isTokenValid, logout, getCurrentUser } from '../utils/auth.helper';

const Header = () => {
  const navigate = useNavigate();
  const userLoggedIn = isTokenValid();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="p-4 bg-gray-200 flex justify-between items-center">
      <div className="font-bold text-lg">MyApp</div>
      <nav className="flex gap-4">
        {!userLoggedIn ? (
          <>
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
            <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
            {user?.type_id === 1 && (
              <Link to="/requestor-match" className="text-blue-600 hover:underline">Requestor Match</Link>
            )}
            {user?.type_id === 2 && (
              <Link to="/traveler-match" className="text-blue-600 hover:underline">Traveler Match</Link>
            )}
            <Link to="/chat" className="text-blue-600 hover:underline">Chat</Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
