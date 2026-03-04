{/* Login Form */}
      <div className="space-y-6">
        {/* Email Input */}
        <div>
          <label htmlFor="contractorEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="contractorEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="contractorPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="contractorPassword"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
            Remember me
          </label>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition"
        >
          Sign In as Contractor
        </button>

        {/* Sign Up & Client Login Links */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600">
            Don't have a contractor account?{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign up
            </a>
          </p>
          <p className="text-center text-sm text-gray-600">
            Looking to post jobs?{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Client Login
            </a>
          </p>
        </div>
      </div>
    </div>

    {/* Footer */}
    <p className="text-center text-sm text-gray-600 mt-6">
      © 2024 Lancely. All rights reserved.
    </p>
  </div>
</div>
