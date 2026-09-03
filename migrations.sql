-- 1. Create Events Table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT
);

-- 2. Create Registrations Table (For Participant Applications & Cancellations)
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- Options: 'active' or 'canceled'
  cancellation_reason TEXT
);
