# Backend Deployment Guide

Since your frontend is live, it cannot communicate with `localhost`. You must deploy your backend to the cloud.

## 1. Database (PostgreSQL) - **CRITICAL**
Your backend uses PostgreSQL. You need a **cloud database** because the deployed backend cannot access your local database.
**Recommended:** [Neon.tech](https://neon.tech) (Free tier is great) or [Vercel Postgres].

1.  Create a project on Neon/Vercel Postgres.
2.  Get the **Connection String** (e.g., `postgres://user:pass@ep-xyz.region.aws.neon.tech/neondb`).
3.  You will use this as your `DATABASE_URL`.

## 2. Prepare `FIREBASE_SERVICE_ACCOUNT_JSON`
For cloud deployment, we cannot upload the `service-account.json` file securely. I have updated the code to read it from an Environment Variable.
1.  Open your local `firebase-service-account.json` file.
2.  Copy the **entire content** (the whole JSON object).
3.  Remove newlines if your deployment platform requires it (Vercel usually handles pasted JSON fine).
4.  You will paste this value into the `FIREBASE_SERVICE_ACCOUNT_JSON` variable.

## 3. Environment Variables (Copy these to Vercel/Render)
You need to add these to your Project Settings > Environment Variables.

| Variable | Value / Instruction |
| :--- | :--- |
| **`NODE_ENV`** | `production` |
| **`PORT`** | `3001` (Or default provided by host) |
| **`DATABASE_URL`** | Your Cloud Postgres Connection String (from Step 1) |
| **`CORS_ORIGIN`** | `https://www.englishwitharik.com` (Your live frontend) |
| **`FIREBASE_SERVICE_ACCOUNT_JSON`** | **Paste the content of your JSON file here** (See Step 2) |
| **`FIREBASE_STORAGE_BUCKET`** | `english-tests-8ee46.firebasestorage.app` |
| **`OPENAI_API_KEY`** | (Copy from your local `.env`) |
| **`MIDTRANS_SERVER_KEY`** | (Copy from your local `.env`) |
| **`MIDTRANS_CLIENT_KEY`** | (Copy from your local `.env`) |
| **`MIDTRANS_IS_PRODUCTION`** | `true` (if ready for real payments) or `false` |
| **`CLOUDINARY_CLOUD_NAME`** | (Copy from your local `.env`) |
| **`CLOUDINARY_API_KEY`** | (Copy from your local `.env`) |
| **`CLOUDINARY_API_SECRET`** | (Copy from your local `.env`) |

## 4. Deploying to Vercel (Recommended since you use Vercel)
1.  Go to Vercel Dashboard > **Add New Project**.
2.  Import your repository.
3.  **Root Directory**: Click "Edit" and select `backend`.
4.  **Framework Preset**: Select "Other" (or verify it detects properly).
5.  **Environment Variables**: Add all the variables from Step 3.
6.  Click **Deploy**.

## 5. Final Step: Connect Frontend
Once the backend is live (e.g., `https://backend-xyz.vercel.app`), go to your **Frontend Project** in Vercel:
1.  Settings > Environment Variables.
2.  Update `NEXT_PUBLIC_API_URL` to `https://backend-xyz.vercel.app/api/v1` (Note: `/api/v1` might be needed depending on routes, check `/health` first).
3.  **Redeploy user Frontend**.
