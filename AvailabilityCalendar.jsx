import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);

const formatHour = (h) => {
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h > 12 ? h - 12 : h}:00 ${suffix}`;
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

// TODO: Replace with backend data
const initialAvailability = {
  Mon: [9, 10, 11, 14, 15],
  Tue: [8, 9, 10, 13, 14, 15, 16],
  Wed: [10, 11, 12],
  Thu: [8, 9, 13, 14, 15, 16, 17],
  Fri: [9, 10, 11, 12, 14, 15],
  Sat: [10, 11, 12],
  Sun: [],
};

const initialBooked = {
  Mon: [10], Tue: [14], Wed: [], Thu: [9], Fri: [], Sat: [], Sun: [],
};

function CalendarGrid({ availability, booked, onSlotClick, selected, mode }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);

  const monthLabel = () => {
    const opts = { month: "short", day: "numeric" };
    return `${weekDates[0].toLocaleDateString("en-US", opts)} – ${weekDates[6].toLocaleDateString("en-US", opts)}, ${weekDates[6].getFullYear()}`;
  };

  const getSlotState = (day, hour) => {
    if (booked[day]?.includes(hour)) return "booked";
    if (availability[day]?.includes(hour)) return "open";
    return "unavailable";
  };

  const slotStyle = (day, hour) => {
    const state = getSlotState(day, hour);
    const sel = selected?.day === day && selected?.hour === hour;
    if (sel) return "bg-blue-600 text-white font-semibold";
    if (state === "booked") return "bg-yellow-50 text-yellow-700 cursor-not-allowed";
    if (state === "open") return mode === "contractor"
      ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-500"
      : "bg-green-50 text-green-700 hover:bg-green-100";
    return "bg-gray-50 text-gray-300 cursor-not-allowed";
  };

  const slotLabel = (day, hour) => {
    const state = getSlotState(day, hour);
    const sel = selected?.day === day && selected?.hour === hour;
    if (sel) return "Selected";
    if (state === "booked") return "Booked";
    if (state === "open") return "Open";
    return "—";
  };

  const isClickable = (day, hour) => {
    const state = getSlotState(day, hour);
    if (mode === "contractor") return true;
    return state === "open";
  };

  return (
    <div>
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
            {DAYS.map((day) => (
              <div
                key={`${day}-${hour}`}
                onClick={() => isClickable(day, hour) && onSlotClick(day, hour)}
                className={`p-2 border-b border-r border-gray-100 text-center text-xs cursor-pointer transition-colors ${slotStyle(day, hour)}`}
              >
                {slotLabel(day, hour)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Open</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" /> Booked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Unavailable</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Selected</span>
      </div>
    </div>
  );
}

function ClientView({ availability, booked, setBooked }) {
  const [selected, setSelected] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const handleBook = () => {
    if (!selected) return;
    // TODO: Send booking request to backend
    setBooked((prev) => ({
      ...prev,
      [selected.day]: [...(prev[selected.day] || []), selected.hour],
    }));
    setConfirmation(selected);
    setSelected(null);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Contractor Availability</h2>
      <p className="text-sm text-gray-500 mb-4">Select an open time slot to request a booking.</p>

      <CalendarGrid
        availability={availability}
        booked={booked}
        selected={selected}
        onSlotClick={(day, hour) => setSelected({ day, hour })}
        mode="client"
      />

      {selected && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Selected:</span> {selected.day}, {formatHour(selected.hour)}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:underline">Clear</button>
            <button onClick={handleBook} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Book Slot</button>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-green-800">
            Booking confirmed for <span className="font-semibold">{confirmation.day}, {formatHour(confirmation.hour)}</span>.
          </p>
          <button onClick={() => setConfirmation(null)} className="text-xs text-green-600 hover:underline">Dismiss</button>
        </div>
      )}
    </div>
  );
}

function ContractorView({ availability, setAvailability }) {
  const [selected, setSelected] = useState(null);

  const toggleSlot = (day, hour) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      const exists = daySlots.includes(hour);
      return {
        ...prev,
        [day]: exists ? daySlots.filter((h) => h !== hour) : [...daySlots, hour].sort((a, b) => a - b),
      };
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Manage Availability</h2>
      <p className="text-sm text-gray-500 mb-4">Click any slot to toggle it as available or unavailable.</p>

      <CalendarGrid
        availability={availability}
        booked={{}}
        selected={selected}
        onSlotClick={(day, hour) => toggleSlot(day, hour)}
        mode="contractor"
      />
    </div>
  );
}

export default function AvailabilityCalendar() {
  const [view, setView] = useState("client");
  const [availability, setAvailability] = useState(initialAvailability);
  const [booked, setBooked] = useState(initialBooked);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView("client")}
            className={`px-4 py-2 text-sm rounded-lg ${view === "client" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            Client View
          </button>
          <button
            onClick={() => setView("contractor")}
            className={`px-4 py-2 text-sm rounded-lg ${view === "contractor" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            Contractor Dashboard
          </button>
        </div>

        {view === "client"
          ? <ClientView availability={availability} booked={booked} setBooked={setBooked} />
          : <ContractorView availability={availability} setAvailability={setAvailability} />
        }
      </div>
    </div>
  );
}
