---
description: How to deploy 10xCoders Platform (Backend on Render, Frontend on Vercel)
---

# 🚀 Deployment Guide: 10xCoders Platform

This guide outlines the steps to deploy the full-stack application.
- **Backend:** [Render](https://render.com/) (Free Tier)
- **Frontend:** [Vercel](https://vercel.com/) (Free Tier)
- **Database:** MongoDB Atlas

---

## ✅ Part 1: GitHub Preparation

1.  **Push Code**: Ensure your latest code is pushed to your GitHub repository.
    ```bash
    git add .
    git commit -m "Ready for deploy"
    git push origin main
    ```
2.  **Repo Structure Check**: Confirm you have:
    - `/client` (React App)
    - `/server` (Node App)
    - `package.json` in root (optional, but good) or in subfolders.

---

## 🛠 Part 2: Backend Deployment (Render)

1.  **Create Account**: Go to [render.com](https://render.com/) and sign up with GitHub.
2.  **New Web Service**: Click **"New +"** -> **"Web Service"**.
3.  **Connect Repo**: Select your `10xCoders-Online-Education-Platform` repo.
4.  **Configure Settings**:
    - **Name**: `10xcoders-backend` (or similar)
    - **Region**: Closest to you (e.g., Singapore for India)
    - **Root Directory**: `server` 👈 **IMPORTANT**
    - **Runtime**: Node
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js` (or `npm start`)
5.  **Environment Variables**:
    - Scroll down to "Environment Variables" and click "Add Environment Variable".
    - You must manually copy-paste every key-value pair from your local `server/.env` file.
    - **CRITICAL CHANGE**:
        - `NODE_ENV`: Set to `production`
        - `FRONTEND_URL`: **SKIP FOR NOW** (We will update this after Part 3).
        - `JUDGE0_URL`: If you are not self-hosting Judge0 on a VPS, you must use a RapidAPI key/url here or the feature will break.
6.  **Create Web Service**: Click "Create Web Service".
7.  **Wait**: It will take a few minutes. Once deployed, Render will give you a URL (e.g., `https://10xcoders-backend.onrender.com`).
    - **Copy this URL**. You need it for the frontend.

---

## 🎨 Part 3: Frontend Deployment (Vercel)

1.  **Create Account**: Go to [vercel.com](https://vercel.com/) and sign up with GitHub.
2.  **Add New Project**: Click **"Add New..."** -> **"Project"**.
3.  **Import Repo**: Find `10xCoders-Online-Education-Platform` and click "Import".
4.  **Configure Project**:
    - **Framework Preset**: Vite (should auto-detect)
    - **Root Directory**: Click "Edit" and select `client`. 👈 **IMPORTANT**
5.  **Environment Variables**:
    - Expand "Environment Variables".
    - Copy keys from `client/.env`.
    - **CRITICAL CHANGE**:
        - You likely have a variable for the backend URL (e.g., `VITE_API_URL` or `VITE_BACKEND_URL`).
        - Set its value to your **Render Backend URL** (e.g., `https://10xcoders-backend.onrender.com`).
6.  **Deploy**: Click "Deploy".
7.  **Wait**: Vercel will build your site. Once done, you will get a live URL (e.g., `https://10xcoders.vercel.app`).

---

## 🔄 Part 4: Final Connection (Linking them up)

1.  **Update Server**:
    - Go back to your **Render Dashboard** -> Your Web Service -> **Environment**.
    - Add/Update `FRONTEND_URL` to your new **Vercel URL** (e.g., `https://10xcoders.vercel.app`).
    - **Save Changes**. (Render will auto-restart the server).
2.  **Update OAuth (Google/GitHub)**:
    - Go to Google Cloud Console & GitHub Developer Settings.
    - **Authorized Origins**: Add your Vercel URL (`https://10xcoders.vercel.app`).
    - **Authorized Redirect URIs**: Update to use your Render URL:
        - `https://10xcoders-backend.onrender.com/auth/google/callback`
        - `https://10xcoders-backend.onrender.com/auth/github/callback`

---

## 🎉 Done!
Your app should now be live and fully connected.
