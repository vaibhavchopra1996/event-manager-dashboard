import bcrypt from 'bcryptjs';
import { pool, queryOne } from '../config/db';

const DEMO_USER = { name: 'Demo Organizer', email: 'demo@example.com', password: 'password123' };

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await queryOne<{ id: number }>(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [DEMO_USER.name, DEMO_USER.email, passwordHash],
  );

  const events = [
    ['Next.js Meetup', 'Monthly meetup about the App Router and RSC.', '2026-10-14', 'Bengaluru'],
    ['Postgres Deep Dive', 'Indexing, query plans and raw SQL patterns.', '2026-11-02', 'Remote'],
    ['Design Systems Workshop', 'Building sleek UI with Tailwind CSS.', '2026-09-28', 'Pune'],
  ];

  for (const [name, description, date, location] of events) {
    const event = await queryOne<{ id: number }>(
      `INSERT INTO events (name, description, date, location, owner_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, description, date, location, user!.id],
    );
    await pool.query(
      `INSERT INTO registrations (event_id, participant_name, participant_email, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, participant_email) DO NOTHING`,
      [event!.id, 'Asha Rao', 'asha@example.com', 'Looking forward to it!'],
    );
  }

  console.log(`Seeded ${events.length} events for ${DEMO_USER.email} / ${DEMO_USER.password}`);
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
