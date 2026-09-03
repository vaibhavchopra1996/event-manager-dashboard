# 🌐 API Endpoints Documentation

All requests base URL: `http://localhost:5000/api`

## 📅 Event Endpoints

### 1. Create Event
- **URL:** `/events`
- **Method:** `POST`
- **Payload (Body):**
  ```json
  {
    "name": "Web Dev Workshop",
    "description": "Learn Next.js basics",
    "date": "2026-10-15",
    "location": "Virtual"
  }
  ```

### 2. Fetch All Events
- **URL:** `/events`
- **Method:** `GET`

### 3. Delete Event
- **URL:** `/events/:id`
- **Method:** `DELETE`

---

## 👥 Registration Endpoints

### 1. Apply to Event (Feature 4)
- **URL:** `/events/:id/register`
- **Method:** `POST`
- **Payload (Body):**
  ```json
  {
    "name": "Alice Smith",
    "email": "alice@example.com"
  }
  ```

### 2. See Participants Roster (Feature 5)
- **URL:** `/events/:id/participants`
- **Method:** `GET`

### 3. Cancel Registration with Reason (Feature 5)
- **URL:** `/registrations/:id/cancel`
- **Method:** `PATCH`
- **Payload (Body):**
  ```json
  {
    "reason": "Event timings clashed with exam schedule"
  }
  ```
