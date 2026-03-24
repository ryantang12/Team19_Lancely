import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8AM–5PM

// TODO: Replace with backend data
const mockAvailability = {
  Mon: [9, 10, 11, 14, 15],
  Tue: [8, 9, 10, 13, 14, 15, 16],
  Wed: [10, 11, 12],
  Thu: [8, 9, 13, 14, 15, 16, 17],
  Fri: [9, 10, 11, 12, 14, 15],
  Sat: [10, 11, 12],
  Sun: [],
};

const formatHour = (h) => {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${suffix}`;
};

const getWeekDates = (offset) => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

export default function AvailabilityCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const weekDates = getWeekDates(weekOffset);

  const monthLabel = () => {
    const first = weekDates[0];
    const last = weekDates[6];
    const opts = { month: "short", day: "numeric" };
    return `${first.toLocaleDateString("en-US", opts)} – ${last.toLocaleDateString("en-US", opts)}, ${last.getFullYear()}`;
  };

  const isAvailable = (day, hour) => mockAvailability[day]?.includes(hour);
  const isSelected = (day, hour) => selected?.day === day && selected?.hour === hour;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Contractor Availability</h1>
        <p className="text-sm text-gray-500 mb-4">Select an available time slot to schedule an appointment.</p>

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100">← Prev</button>
          <span className="text-sm font-medium text-gray-700">{monthLabel()}</span>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100">Next →</button>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-8">
            <div className="p-2 bg-gray-50 border-b border-r border-gray-200" />
            {DAYS.map((day, i) => (
              <div key={day} className="p-2 text-center border-b border-gray-200 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500">{day}</p>
                <p className="text-sm font-medium text-gray-800">{weekDates[i].getDate()}</p>
              </div>
            ))}
          </div>

          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8">
              <div className="p-2 text-xs text-gray-500 text-right pr-3 border-r border-gray-100 flex items-center justify-end">
                {formatHour(hour)}
              </div>
              {DAYS.map((day) => {
                const available = isAvailable(day, hour);
                const sel = isSelected(day, hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    onClick={() => available && setSelected({ day, hour })}
                    className={`p-2 border-b border-r border-gray-100 text-center text-xs cursor-pointer transition-colors ${
                      sel
                        ? "bg-blue-600 text-white font-semibold"
                        : available
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-gray-50 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {available ? (sel ? "Selected" : "Open") : "—"}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {selected && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Selected:</span> {selected.day}, {formatHour(selected.hour)}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
