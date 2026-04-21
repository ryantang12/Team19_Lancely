import { useState } from "react";

const StarIcon = ({ filled, half }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`half-${Math.random().toString(36).slice(2)}`}>
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#d1d5db" />
      </linearGradient>
    </defs>
    <path
      d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21l-4-3.9 5.53-.8L10 1.5z"
      fill={filled ? "#f59e0b" : half ? "url(#half-star)" : "#d1d5db"}
      stroke={filled || half ? "#f59e0b" : "#d1d5db"}
      strokeWidth="0.5"
    />
  </svg>
);

const StarRating = ({ rating, size = "sm" }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <StarIcon key={i} filled={i <= Math.floor(rating)} half={i === Math.ceil(rating) && rating % 1 !== 0} />
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

const RatingBar = ({ stars, count, total, accentColor }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-gray-500 font-medium">{stars}</span>
      <StarIcon filled />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${accentColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-gray-400 text-xs">{count}</span>
    </div>
  );
};

const ReviewCard = ({ review, accentBorder }) => (
  <div className={`p-4 rounded-xl border ${accentBorder} bg-white transition-shadow hover:shadow-md`}>
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-semibold text-gray-800 text-sm">{review.author}</p>
        <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{review.jobType}</span>
    </div>
    <StarRating rating={review.rating} />
    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.text}</p>
  </div>
);

export default function ReviewsRatings({ reviews = { contractor: [], client: [] }, userRole = "contractor", userName = "" }) {
  const [activeTab, setActiveTab] = useState("received");
  const [filterStars, setFilterStars] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  const isContractor = userRole === "contractor";
  const themeConfig = isContractor
    ? { accent: "bg-emerald-500", accentLight: "bg-emerald-50", accentText: "text-emerald-600", accentBorder: "border-emerald-100", badge: "bg-emerald-100 text-emerald-700", tabActive: "bg-emerald-600 text-white", tabInactive: "text-emerald-600 hover:bg-emerald-50" }
    : { accent: "bg-indigo-500", accentLight: "bg-indigo-50", accentText: "text-indigo-600", accentBorder: "border-indigo-100", badge: "bg-indigo-100 text-indigo-700", tabActive: "bg-indigo-600 text-white", tabInactive: "text-indigo-600 hover:bg-indigo-50" };

  const receivedReviews = isContractor ? reviews.contractor : reviews.client;
  const givenReviews = isContractor ? reviews.client : reviews.contractor;
  const currentReviews = activeTab === "received" ? receivedReviews : givenReviews;

  const avgRating = currentReviews.length > 0
    ? (currentReviews.reduce((sum, r) => sum + r.rating, 0) / currentReviews.length).toFixed(1)
    : "0.0";

  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: currentReviews.filter((r) => r.rating === s).length,
  }));

  let displayReviews = filterStars
    ? currentReviews.filter((r) => r.rating === filterStars)
    : [...currentReviews];

  if (sortBy === "newest") displayReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (sortBy === "highest") displayReviews.sort((a, b) => b.rating - a.rating);
  else displayReviews.sort((a, b) => a.rating - b.rating);

  return (
    <div className="max-w-2xl mx-auto font-sans">
      {/* Header */}
      <div className={`rounded-2xl p-5 mb-5 ${themeConfig.accentLight}`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-800">Reviews & Ratings</h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${themeConfig.badge}`}>
            {isContractor ? "Contractor" : "Client"}
          </span>
        </div>
        <p className="text-sm text-gray-500">{userName}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {["received", "given"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFilterStars(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? themeConfig.tabActive : themeConfig.tabInactive}`}
          >
            {tab === "received" ? "Reviews Received" : "Reviews Given"}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex gap-6 mb-5 items-start">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-800">{avgRating}</p>
          <StarRating rating={parseFloat(avgRating)} />
          <p className="text-xs text-gray-400 mt-1">{currentReviews.length} review{currentReviews.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {ratingCounts.map((rc) => (
            <button key={rc.stars} onClick={() => setFilterStars(filterStars === rc.stars ? null : rc.stars)} className="w-full">
              <RatingBar stars={rc.stars} count={rc.count} total={currentReviews.length} accentColor={themeConfig.accent} />
            </button>
          ))}
        </div>
      </div>

      {filterStars && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Filtering: {filterStars} star{filterStars !== 1 ? "s" : ""}</span>
          <button onClick={() => setFilterStars(null)} className={`text-xs font-medium ${themeConfig.accentText} hover:underline`}>Clear</button>
        </div>
      )}

      {/* Sort */}
      <div className="flex justify-end mb-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {displayReviews.length > 0 ? (
          displayReviews.map((review) => (
            <ReviewCard key={review.id} review={review} accentBorder={themeConfig.accentBorder} />
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">
            {filterStars ? "No reviews match this filter." : "No reviews yet."}
          </div>
        )}
      </div>
    </div>
  );
}
