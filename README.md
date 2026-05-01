# Greenhouse Climate Monitoring System

Modern greenhouse monitoring dashboard with a Node/Express backend, MongoDB data storage, MQTT ingestion support, and a Vite + React frontend for live monitoring, analytics, alerts, and AI-assisted operations.

## Overview

The project is designed to help greenhouse operators track climate conditions, review trends, react to alerts, and ask an AI assistant for guidance.

Core capabilities:

- Live sensor monitoring for temperature, humidity, soil moisture, light, air quality, and related telemetry
- Historical charts and trend analysis for comparing sensor behavior over time
- Alert management with cleanup and recommendation support
- Forecast views for short-term planning
- AI assistant chat with conversation history and status checks
- MQTT-to-MongoDB ingestion for streaming greenhouse data into the database


## Frontend  
### Home Page
![Image](https://github.com/user-attachments/assets/c17f182b-54bf-423c-856a-fa38bb0c4f87)

## Project Structure

```text
.
	mqtt_to_mongo.js          # Optional MQTT ingestion script
	backend/                  # Express API server and data services
	frontend/                 # React + Vite dashboard application
```

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, MQTT
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Recharts, Zustand, React Query

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- MongoDB running locally or remotely
- OpenAI API key if you want the AI assistant to use live AI responses

## Environment Variables

Create a `.env` file in the repository root for the backend.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_greenhouse
CLIENT_ORIGIN=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key_here
```

Optional MQTT ingestion script settings are currently hardcoded in `mqtt_to_mongo.js`:

- Broker: `mqtt://broker.hivemq.com`
- Topic: `greenhouse/data`
- MongoDB database: `smart_greenhouse`
- Collection: `readings`

## Installation

Install backend dependencies from the repository root:

```bash
npm install
```

Install frontend dependencies separately:

```bash
cd frontend
npm install
```

## Run the Application

Start the backend API server from the repository root:

```bash
node backend/server.js
```

Start the frontend development server in a separate terminal:

```bash
cd frontend
npm run dev
```

By default, Vite proxies `/api` requests to `http://localhost:5000`.

## Optional MQTT Ingestion

If you want to stream greenhouse sensor data into MongoDB through MQTT, run:

```bash
node mqtt_to_mongo.js
```

This subscribes to the configured MQTT topic and stores incoming readings in MongoDB.

## Frontend Features

- Dashboard with live greenhouse status and sensor cards
- Analytics page with charts, trends, and anomaly-oriented analysis
- Alerts page for viewing and managing alert records
- History page for browsing stored sensor data
- Floating AI assistant for quick greenhouse questions and support contact info
- Settings panel and responsive navigation for desktop and mobile

## Backend API Overview

The backend exposes these main routes:

- `/api/sensors`
	- `POST /` create sensor data
	- `GET /` list sensor data
	- `GET /latest` fetch the newest reading
	- `GET /stats` fetch summary statistics
	- `GET /:sensorId` fetch data for a specific sensor record
- `/api/analysis`
	- `GET /trends/:sensorId`
	- `GET /correlation/:sensorId`
	- `GET /ml-anomalies/:sensorId`
- `/api/alerts`
	- `GET /` list alerts
	- `GET /stats` alert statistics
	- `GET /:id` fetch a single alert
	- `DELETE /cleanup` remove old alerts
	- `DELETE /clear` remove all alerts
- `/api/alert-recommendations`
	- `GET /:alertId`
	- `POST /multiple`
	- `GET /current`
- `/api/forecast`
	- `GET /1hour`
- `/api/ai-assistant`
	- `POST /chat`
	- `GET /conversation/:conversationId`
	- `GET /status`

## Development Notes

- The frontend uses relative `/api` URLs, so the Vite proxy must be able to reach the backend server.
- The backend starts watching MongoDB inserts after a successful database connection so new readings can trigger alert logic.
- `frontend/dist/` is generated during production builds and should not be committed.

## Build

Build the frontend for production:

```bash
cd frontend
npm run build
```

## Repository Layout

```text
backend/
	config/
	controllers/
	models/
	routes/
	services/
	ml/
frontend/
	src/
		app/
			Pages/
			components/
			services/
			contexts/
			styles/
```
