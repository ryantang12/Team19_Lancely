
import { useState } from "react";
import { Wrench, DollarSign, Star, Clock, TrendingUp, CheckCircle, MessageSquare, User } from "lucide-react";

export default function ContractorDashboard() {
  const [stats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: "$0",
    avgRating: "N/A",
  });

  const activeApplications = [];
  const recentReviews = [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-indigo-600">Contractor Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's your work activity.</p>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Browse Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Jobs */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeJobs}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">Currently in progress</p>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedJobs}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-green-600 text-sm mt-4 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +0 this month
            </p>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEarnings}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">From completed jobs</p>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgRating}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">Based on client reviews</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Applications */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Active Applications</h2>
            </div>
            {activeApplications.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No active applications</h3>
                <p className="text-gray-600 mb-4">Browse jobs and start applying!</p>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm">
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activeApplications.map((app) => (
                  <div key={app.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{app.title}</p>
                      <p className="text-sm text-gray-600">{app.location} • {app.budget}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
            </div>
            {recentReviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</h3>
                <p className="text-gray-600">Complete jobs to start receiving reviews!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentReviews.map((review) => (
                  <div key={review.id} className="px-6 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-indigo-600" />
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{review.client}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">{review.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
