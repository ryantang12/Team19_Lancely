import { useState } from 'react';
import { ArrowLeft, Wrench, MapPin, DollarSign, Clock, Calendar, User, MessageSquare, AlertCircle } from 'lucide-react';

export default function SingleJob() {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // TODO: Fetch job details from backend based on job ID
  const job = {
    id: null,
    title: 'Job Title',
    category: 'Category',
    location: 'Location',
    budget: '$0',
    timeframe: 'Timeframe',
    posted: 'Just now',
    responses: 0,
    status: 'Active',
    description: 'Job description will appear here...',
    requirements: 'Requirements will appear here...',
    clientInfo: {
      name: 'Client Name',
      memberSince: 'January 2024',
      jobsPosted: 0,
      rating: 0,
      reviews: 0
    }
  };

  const handleSubmitResponse = () => {
    // TODO: Add API call to submit response
    console.log('Submitting response:', responseMessage);
    alert('Your response has been sent to the client!');
    setShowResponseForm(false);
    setResponseMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to All Jobs
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <span className="inline-block mt-3 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                {job.category}
              </span>
            </div>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              {job.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Location</p>
                    <p className="font-semibold text-sm">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Budget</p>
                    <p className="font-semibold text-sm">{job.budget}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Timeframe</p>
                    <p className="font-semibold text-sm">{job.timeframe}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Posted</p>
                    <p className="font-semibold text-sm">{job.posted}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.requirements}</p>
            </div>

            {/* Safety Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Safety First</h3>
                <p className="text-sm text-yellow-800">
                  Always communicate through Lancely. Never share personal financial information. 
                  Meet in public places when possible and trust your instincts.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Client Info */}
          <div className="space-y-6">
            {/* Response Actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Interested in this job?</h3>
              
              {!showResponseForm ? (
                <button 
                  onClick={() => setShowResponseForm(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Send Response
                </button>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={6}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Introduce yourself and explain why you're a good fit for this job..."
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitResponse}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => setShowResponseForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{job.responses}</span> people have responded
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Posted By</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{job.clientInfo.name}</p>
                  <p className="text-sm text-gray-600">Member since {job.clientInfo.memberSince}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jobs Posted:</span>
                  <span className="font-semibold">{job.clientInfo.jobsPosted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating:</span>
                  <span className="font-semibold">⭐ {job.clientInfo.rating || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews:</span>
                  <span className="font-semibold">{job.clientInfo.reviews}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Tips for Success</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Be specific about your experience</li>
                <li>• Mention your availability</li>
                <li>• Include relevant photos if possible</li>
                <li>• Respond promptly to messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
