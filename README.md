
# 💫 AI Scheduling Assistant: Your Proactive Personal Planner

**Originally developed as part of NUS IT5007 coursework, and extended as a personal project.**

<img width="2540" height="1168" alt="image" src="https://github.com/user-attachments/assets/088fe438-d034-4f81-9774-489642e4f93a" />

This project is an intelligent tool designed to eliminate the friction of planning and scheduling your week. This assistant goes beyond a simple calendar by offering true personalization and visualising your weekly activities!

The system acts as your dedicated planner, using large language models (LLMs) to arrange activities based on two core datasets: 
your current timetable (existing events) and your unique personal preferences (custom rules). Simply ask the assistant to schedule an activity, and it will automatically find the optimal slot, ensuring no clashes, and respecting your habits (like "No gym within one hour of meals").

For flexibility: if the AI suggests a conflict based on your rules, you remain in complete control. Just tell the assistant you insist on the specific time, and it will bypass your preference and book the slot for you.

## Core Features

* **Intelligent Scheduling:** Uses DeepSeek LLMs to parse natural language and convert requests into concrete calendar events.
* **Contextual Awareness:** Injects existing calendar data and personal preference rules directly into the AI's reasoning pipeline to find the optimal, conflict-free slot (e.g., automatically suggesting a Wednesday evening dinner if Monday/Tuesday are busy).
* **Personal Preference:** Personalized calendar is designed to eliminate planning friction by giving you **proactive, habit-aware advice** and visualizing your schedule to help you **achieve your weekly goals** easily.
* **Relationship Tracking:** The sidebar automatically parses event titles (e.g., "Dinner with Leo") to categorize and summarize time allocated to specific contacts.
* **DTO & Timezone Safe:** Backend is designed with a Data Transfer Object (DTO) layer to ensure time zone conversions and data formatting are correct across all GraphQL transactions.

## 📁 Project Structure

### Backend (`/backend`)
The backend is a Node.js/TypeScript service using Apollo Server and MongoDB.

- `src/`
    - `index.ts` — Server entry point (Apollo Server, DB connection)
    - `db.ts` — MongoDB connection logic
    - `schema.ts` — GraphQL Type Definitions (Types, Queries, Mutations)
    - `resolvers.ts` — GraphQL Resolvers (Business logic, DTO mapping)
    - `agents/AIAgents.ts` — **Core LLM Logic**, Tool Definition, and Prompt Engineering
    - `models/` — Mongoose Data Models (`User.ts`, `CalendarEvent.ts`, etc.)
    - `utils/auth.ts` — JWT handling and authentication helpers

### Frontend (`/frontend-react`)
The frontend is built with React and Vite.

- `src/`
    - `main.tsx` — React entry
    - `pages/` — Page-level components (`DashboardPage.tsx`, `LoginPage.tsx`)
    - `components/` — Reusable UI components (`CalendarView.tsx`, `AssistantPanel.tsx`, `PreferencePanel.tsx`)
    - `graphql/queries.ts` — Apollo GraphQL Queries and Mutations

---
## Project Documentation and General Aspects
The problem addressed is the high cognitive load and friction involved in manual calendar scheduling, especially when balancing personal habits, social dynamics, and professional commitments. It trackes user's relationship and habits, acting as a personal assistant, being able to record user and user's contact's habits, it's convinence outweighs all the current calendars in the market. As digital schedules become more complex, this problem is predicted to remain highly relevant in the coming 10 years.

## Solution Architecture 
The solution employs a strict decoupled architecture:
* **Frontend (Vite/React):** Handles UI/UX and GraphQL requests.
* **Backend (Apollo/Node.js):** Serves the GraphQL API and handles business logic, authentication, and communication with third-party services (LLMs).
* **Data Flow:** **Tool Use (ReAct) Pattern** is implemented for the AI assistant, allowing the AI to query calendar data before generating a response.
  

## Legal and Competition Analysis (Novelty)
* **Legal Aspects:** The project utilizes several open-source libraries (`bcryptjs`, `jsonwebtoken`, Apollo Client).
* **Competition:** We analyzed the nearest market competitors (e.g., Google Calendar, specialized dating apps). Our solution's novel integration of a custom LLM rule-engine offers a competitive advantage in personalized scheduling. It's convience and ability to consider multi-factors and plan the schedule for user was unique and novel in the current market.

##  Getting Started (Development Setup)

### Prerequisites

You must have the following installed:
* **Node.js** (v20+)
* **npm**
* **Docker** (and Docker Compose)

### Execution Steps

#### 1. Start the Database (MongoDB terminal)

We use Docker Compose to quickly launch a dedicated MongoDB instance.

```bash
docker-compose up -d mongo-db
````

*(To stop the database: `docker-compose down`)*

#### 2\. Configure Environment Variables

Copy the `.env.example` file to `.env` and configure your keys. **You must provide a valid DEEPSEEK\_API\_KEY.**

```bash
cp .env.example .env
```

*(Open the `.env` file and set `MONGODB_URI`, `JWT_SECRET`, and your `DEEPSEEK_API_KEY`.)*

#### 3\. Install Dependencies

Run `npm install` from the project root. This installs dependencies for the root, `/backend`, and `/frontend-react`.

```bash
npm install
```

```bash
mongod --dbpath .\data\db --bind_ip 0.0.0.0 --port 27017 --logpath .\log\mongodb.log
```


#### 4\. Launch Development Servers

##### Backend Terminal
```
cd backend
```
For Node.js version under 20:
```
nvm install 20 
nvm use 20 
```
Then:
```
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
npm run dev
```
##### Frontend Terminal
```
cd frontend-react
```
For Node.js version under 20:
`nvm use 20`
Then:
```
npm install --save-dev ts-node-dev@1.1.8 typescript@3.9 @types/node@10
npm run dev
```

| Service | Address |
| :--- | :--- |
| **Backend (Apollo GQL)** | http://localhost:4000 |
| **Frontend (Vite React)** | http://localhost:5173 (or as prompted by Vite) |

### Debugging Workflow

1.  Access the frontend: **http://localhost:5173**
2.  Log in (using test credentials or register a new user).
3.  Go to the Dashboard (`/dashboard`).
4.  Interact with the **AI Assistant** panel (Right side) to schedule activities based on your preferences.
5.  Check the Node.js terminal output (running `npm run dev`) for verbose `console.log` messages showing the AI's reasoning, tool calls, and final decision path.

If JWS Secret token expired: 
In console, run:
`localStorage.removeItem("token")`

## A simple demo
demo.mp4 is provided showcasing our AI Scheduling Assistant, including its ability to plan based on multi-factors including existing calendar events, understanding user and dating contacts' preferences, and add multiple events on one command, etc. 

## Project Architecture

```text
Root/ (Project Root)
│
├── .env.example
├── .gitignore
├── docker-compose.yml (Defines MongoDB service)
├── package.json (Root dependencies)
├── log/ (Database output)
│
├── data/
│   └── db/ (MongoDB Persistent Storage)
│
├─┬ backend/ (API Gateway, Logic, and AI Engine)
│ │
│ ├── package.json
│ ├── tsconfig.json
│ └── src/
│     ├─┬ agents/
│     │ └── AIAgents.ts (Core LLM Logic, Prompt Engineering, Tool Interface)
│     │
│     ├─┬ models/
│     │ ├── CalendarEvent.ts
│     │ └── User.ts (Includes Preferences Schema)
│     │
│     ├── services/
│     │   └── auth.ts (JWT & Hashing)
│     │
│     ├── utils/
│     │   └── db.ts (MongoDB Connection)
│     │
│     ├── resolvers.ts (GraphQL Business Logic, Guardrail Execution)
│     ├── schema.ts (GraphQL Type Definitions)
│     └── index.ts (Apollo Server Setup)
│
└─┬ frontend-react/ (Client Presentation Layer)
  │
  ├── package.json
  └── src/
      ├─┬ components/
      │ ├── AssistantPanel.tsx (Chat UI, History Management)
      │ ├── CalendarView.tsx (Primary Display)
      │ └── PreferencePanel.tsx (Preferences Input UI)
      │
      ├─┬ graphql/
      │ ├── client.ts (Apollo Connection)
      │ └── queries.ts (GQL Queries & Mutations)
      │
      └── pages/
          └── DashboardPage.tsx (Data Fetching and Component Integration)

