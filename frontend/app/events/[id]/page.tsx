'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface EventItem {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
}

interface Participant {
  id: number;
  participant_name: string;
  participant_email: string;
  status: string;
  cancellation_reason: string | null;
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Application Form Input States
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');

  // Cancellation Input States
  const [cancelReason, setCancelReason] = useState<{ [key: number]: string }>({});

  const fetchEventAndParticipants = useCallback(async () => {
    try {
      // 1. Fetch Event Meta Details
      const eventRes = await fetch(`http://localhost:5000/api/events/${params.id}`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
      } else {
        alert('Event not found!');
        router.push('/');
        return;
      }

      // 2. Fetch Participants (We can mock or call API endpoints here)
      const partRes = await fetch(`http://localhost:5000/api/events/${params.id}/participants`);
      if (partRes.ok) {
        const partData = await partRes.json();
        setParticipants(partData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      fetchEventAndParticipants();
    }
  }, [params.id, fetchEventAndParticipants]);

  // Handle Feature 4: Apply to Event Submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/events/${params.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: applicantName, email: applicantEmail })
      });

      if (res.ok) {
        alert('Application submitted successfully!');
        setApplicantName('');
        setApplicantEmail('');
        fetchEventAndParticipants(); // Refresh list
      } else {
        alert('Failed to register.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Feature 5: Cancel Registration with Reason
  const handleCancelRegistration = async (registrationId: number) => {
    const reason = cancelReason[registrationId];
    if (!reason || reason.trim() === '') {
      alert('Please provide a reason for cancellation!');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/registrations/${registrationId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        alert('Registration canceled successfully.');
        fetchEventAndParticipants(); // Refresh lists
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="p-6 text-slate-500">Loading event details...</p>;
  if (!event) return <p className="p-6 text-red-500">Event not found.</p>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <button 
        onClick={() => router.push('/')}
        className="text-sm text-slate-600 hover:text-black mb-2 block font-medium"
      >
        ← Back to Dashboard
      </button>

      {/* Event Details Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
          Event ID: #{event.id}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-950">{event.name}</h1>
        
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-slate-100 py-3">
          <div>
            <strong className="block text-slate-500 font-medium">Date</strong>
            <span className="text-slate-800">{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div>
            <strong className="block text-slate-500 font-medium">Location</strong>
            <span className="text-slate-800">{event.location || 'Not specified'}</span>
          </div>
        </div>

        <div>
          <strong className="block text-sm text-slate-500 font-medium mb-1">Description</strong>
          <p className="text-slate-700 bg-slate-50 p-4 rounded-md border border-slate-100">
            {event.description || 'No description provided for this event.'}
          </p>
        </div>
      </div>

      {/* Dual Workspace Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Feature 4 Section: Registration Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 h-fit shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Apply to Event</h2>
          <form onSubmit={handleApply} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
              <input type="text" required value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
              <input type="email" required value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" placeholder="john@example.com" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-medium py-2 rounded-md hover:bg-emerald-700 transition text-sm">
              Submit Registration
            </button>
          </form>
        </div>

        {/* Feature 5 Section: Dashboard Owner Roster */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Dashboard Roster (Owner View)</h2>
          
          {participants.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
              No participants have signed up for this event yet.
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((p) => (
                <div key={p.id} className="border border-slate-100 rounded-lg p-4 flex flex-col justify-between sm:flex-row bg-slate-50 gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{p.participant_name}</p>
                    <p className="text-xs text-slate-500">{p.participant_email}</p>
                    <p className="text-xs mt-1">
                      Status:{' '}
                      <span className={`font-medium capitalize ${p.status === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p.status}
                      </span>
                    </p>
                    {p.cancellation_reason && (
                      <p className="text-xs text-red-500 italic bg-red-50 p-2 rounded mt-1 border border-red-100">
                        Reason: {p.cancellation_reason}
                      </p>
                    )}
                  </div>

                  {p.status === 'active' && (
                    <div className="flex flex-col sm:items-end justify-center gap-2">
                      <input type="text" placeholder="Reason for canceling..." value={cancelReason[p.id] || ''} onChange={(e) => setCancelReason({ ...cancelReason, [p.id]: e.target.value })} className="border border-slate-300 rounded p-1 text-xs w-full sm:w-44 focus:outline-none" />
                      <button onClick={() => handleCancelRegistration(p.id)} className="text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded px-3 py-1.5 transition whitespace-nowrap">
                        Cancel Registration
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
