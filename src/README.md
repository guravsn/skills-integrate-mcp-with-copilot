# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teacher-only activity registration and removal

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Configure teacher credentials in the server environment and start the app:

   ```
   export TEACHER_USERNAME=teacher
   export TEACHER_PASSWORD='replace-with-a-strong-password'
   uvicorn src.app:app --reload
   ```

   Do not commit real credentials to the repository. The application does not
   provide a default teacher account; management requests return an error until
   both environment variables are configured. Serve the application over HTTPS
   outside local development because teacher credentials use HTTP Basic
   authentication.

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/teacher/login`                                                  | Validate teacher credentials                                        |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity (teacher authentication required)            |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Remove a student (teacher authentication required)               |

The web interface lets teachers log in and out. Teacher credentials are kept
only in the browser's memory for the current page session and are sent to the
server for each management request. Anyone can still view the activities and
participants without logging in.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
