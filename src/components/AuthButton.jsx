import React from 'react';
import { User, LogOut } from 'lucide-react';

const AuthButton = ({ onSignIn, onSignOut, isSignedIn = false }) => {
  if (isSignedIn) {
    return (
      <button
        onClick={onSignOut}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition duration-200"
      >
        <LogOut className="h-4 w-4" />
        <span>Đăng xuất</span>
      </button>
    );
  }

  return (
    <button
      onClick={onSignIn}
      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-300 transform hover:scale-105 shadow-lg"
    >
      <User className="inline-block h-5 w-5 mr-2" />
      Đăng nhập với Puter
    </button>
  );
};

export default AuthButton;