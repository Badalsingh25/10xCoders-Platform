# 10xCoders Online Education Platform

A full-stack online education platform for learning and coding.

## Project Structure

This project is organized as a monorepo with the following structure:

- **client/**: The frontend application built with React and Vite.
- **server/**: The backend application built with Node.js and Express.

## Prerequisites

Before running the application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Judge0](https://judge0.com/) (Self-hosted or API) for code execution features

## Setup Instructions

### 1. Environment Variables

This project uses environment variables for configuration. You need to set them up for both the client and server.

**Server:**

1. Navigate to the `server/` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your actual credentials (MongoDB URI, OAuth keys, etc.).

**Client:**

1. Navigate to the `client/` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your API keys.

### 2. Installation

Install dependencies for both the client and server.

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 3. Running the Application

**Start the Server:**
```bash
cd server
npm start
# or for development
npm run dev
```
The server will start on port 5001 (or as defined in .env).

**Start the Client:**
```bash
cd client
npm run dev
```
The client will start on port 5173 (usually). Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- User Authentication (Local & OAuth)
- Course Management
- Online Code Editor (Judge0 Integration)
- User Profiles & Dashboards
- File Uploads
