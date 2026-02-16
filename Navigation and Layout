//Navigation and Layout
import { useState } from 'react';

export default function AuthLayout({ LoginComponent, ForgotPasswordComponent }) {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">Lancely</h1>
            <p className="text-gray-600">
              {showForgotPassword 
                ? "Reset your password" 
                : "Welcome back! Please login to your account."}
            </p>
          </div>

          {/* Navigation */}
          {showForgotPassword && (
            <button
              onClick={() => setShowForgotPassword(false)}
              className="text-sm text-gray-600 hover:text-gray-800 mb-6 flex items-center"
            >
              ← Back to login
            </button>
          )}

          {/* Render appropriate component */}
          {showForgotPassword ? (
            <ForgotPasswordComponent />
          ) : (
            <div>
              <LoginComponent />
              
              {/* Additional Login Options */}
              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign up
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 Lancely. All rights reserved.
        </p>
      </div>
    </div>
  );
}
