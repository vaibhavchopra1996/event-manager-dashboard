'use client';

import { useEffect, useState } from 'react';
import { api, Event } from './utils/api';

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  // 1. Fetch events on load
  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // 2. Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return alert('Name and Date are required!');

    try {
      await api.createEvent({ name, description, date, location });
      // Reset form fields
      setName('');
      setDescription('');
      setDate('');
      setLocation('');
      // Refresh list
      loadEvents();
    } catch (err) {
      alert('Error creating event');
    }
  };

  // 3. Handle Event Deletion
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteEvent(id);
      loadEvents(); // Refresh list
    } catch (err) {
      alert('Error deleting event');
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10 font-sans">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">🗓️ Event Manager Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form to Create Event */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" placeholder="e.g. Tech Conference" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" rows={3} placeholder="Describe the details..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" placeholder="e.g. New York or Virtual" />
            </div>
            <button type="submit" className="w-full bg-black text-white hover:bg-gray-800 font-medium rounded-md py-2.5 text-sm transition-all shadow-sm">
              Add Event
            </button>
          </form>
        </div>

        {/* Right Column: Events Listing */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">All Scheduled Events</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading your events graph...</p>
          ) : events.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
              No events found. Create one using the form on the left!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-gray-400 transition-colors">
                  <div>
                    <span className="text-xs inline-block bg-gray-100 text-gray-600 rounded px-2 py-0.5 mb-2 font-mono">ID: {event.id}</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{event.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description || 'No description provided.'}</p>
                    <div className="text-xs text-gray-500 space-y-1 mb-4">
                      <div>📅 <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</div>
                      <div>📍 <strong>Location:</strong> {event.location || 'Not specified'}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(event.id!)} className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium py-2 rounded-md transition-all">
                    Delete Event
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
