# Complete Netlify Deployment Guide for OrderPick

## Overview
This guide will help you deploy your OrderPick application to Netlify so that the Selro API integration works properly. The app needs to be deployed because the Netlify Functions (which securely handle your Selro API calls) only work in production.

## Prerequisites
- A GitHub, GitLab, or Bitbucket account
- Your Selro API credentials (API Key and API Secret)

## Step 1: Prepare Your Code for Git

### 1.1 Create a Git Repository
If you haven't already, you need to put your code in a Git repository:

1. **Create a new repository on GitHub:**
   - Go to [github.com](https://github.com)
   - Click the "+" icon in the top right
   - Select "New repository"
   - Name it something like "orderpick-app"
   - Make it **Public** (required for free Netlify deployment)
   - Don't initialize with README (your project already has files)
   - Click "Create repository"

### 1.2 Upload Your Code to GitHub
You have several options:

**Option A: Using GitHub's Web Interface (Easiest)**
1. Download your project as a ZIP file from this environment
2. Extract the ZIP file on your computer
3. Go to your new GitHub repository
4. Click "uploading an existing file"
5. Drag and drop all your project files
6. Commit the files with message "Initial commit"

**Option B: Using Git Commands (if you have Git installed)**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/orderpick-app.git
git push -u origin main
```

## Step 2: Deploy to Netlify

### 2.1 Create a Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Click "Sign up" 
3. Choose "Sign up with GitHub" (recommended)
4. Authorize Netlify to access your GitHub account

### 2.2 Deploy Your Site
1. **From your Netlify dashboard:**
   - Click "Add new site"
   - Select "Import an existing project"

2. **Connect to Git provider:**
   - Click "GitHub" 
   - Authorize Netlify if prompted
   - You'll see a list of your repositories

3. **Select your repository:**
   - Find "orderpick-app" (or whatever you named it)
   - Click on it

4. **Configure build settings:**
   - **Branch to deploy:** `main` (should be auto-detected)
   - **Build command:** `npm run build` (should be auto-detected)
   - **Publish directory:** `dist` (should be auto-detected)
   - Click "Deploy site"

### 2.3 Wait for Deployment
- Netlify will start building your site
- This usually takes 2-5 minutes
- You'll see a build log showing the progress
- When complete, you'll get a URL like `https://amazing-name-123456.netlify.app`

## Step 3: Configure Environment Variables

This is the **crucial step** for Selro integration to work.

### 3.1 Get Your Selro API Credentials
1. Log into your Selro account
2. Go to **Channel Integration** → **API** section
3. Copy your:
   - **API Key** (starts with `app4_key`)
   - **API Secret** (starts with `app4_secret`)

### 3.2 Add Environment Variables to Netlify
1. **In your Netlify dashboard:**
   - Go to your site
   - Click "Site settings"
   - In the left sidebar, click "Environment variables"

2. **Add your Selro credentials:**
   - Click "Add a variable"
   - **Key:** `SELRO_API_KEY`
   - **Value:** Your Selro API key (e.g., `app4_keyd1cb8bad-c750-437f-b722-071d9318dde9`)
   - Click "Create variable"

   - Click "Add a variable" again
   - **Key:** `SELRO_API_SECRET`
   - **Value:** Your Selro API secret (e.g., `app4_secretbbcdfc8c-bbd3-4e3e-adc0-2680ca8e98b6`)
   - Click "Create variable"

### 3.3 Redeploy Your Site
After adding environment variables, you need to redeploy:
1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Deploy site"
3. Wait for the new deployment to complete

## Step 4: Test Your Deployment

### 4.1 Access Your Live Site
1. Click on your site URL (e.g., `https://amazing-name-123456.netlify.app`)
2. Your OrderPick application should load

### 4.2 Test Selro Integration
1. Click the **Settings** button (gear icon) in the top right
2. Go to the **Selro API** tab
3. Enter your API credentials (same ones you used in environment variables)
4. Click **Test Connection**
5. You should see "Connected Successfully" ✅

### 4.3 Load Orders from Selro
1. If connection is successful, you'll see "All Orders" folder
2. Click on it to select it
3. The app should load your orders from Selro

## Step 5: Custom Domain (Optional)

### 5.1 Change Site Name
1. In Netlify dashboard, go to "Site settings"
2. Click "Change site name"
3. Enter a custom name like "yourcompany-orderpick"
4. Your URL becomes `https://yourcompany-orderpick.netlify.app`

### 5.2 Add Custom Domain (Pro Feature)
If you have your own domain:
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

## Troubleshooting

### Common Issues and Solutions

**1. Build Fails**
- Check the build log for errors
- Ensure all dependencies are in `package.json`
- Make sure `netlify.toml` is in your repository

**2. Selro Connection Fails**
- Verify environment variables are set correctly
- Check API credentials are valid and active
- Ensure you redeployed after adding environment variables

**3. Functions Don't Work**
- Confirm `netlify/functions/getSelroOrders.js` is in your repository
- Check the Functions tab in Netlify dashboard
- Look at Function logs for errors

**4. Site Loads but Features Don't Work**
- Check browser console for JavaScript errors
- Ensure all files were uploaded to GitHub
- Verify the build completed successfully

### Getting Help

**Check Build Logs:**
1. Go to "Deploys" tab in Netlify
2. Click on the latest deploy
3. View the build log for errors

**Check Function Logs:**
1. Go to "Functions" tab in Netlify
2. Click on `getSelroOrders`
3. View recent invocations and logs

**Contact Support:**
- Netlify has excellent documentation at [docs.netlify.com](https://docs.netlify.com)
- Community forum at [answers.netlify.com](https://answers.netlify.com)

## Security Notes

✅ **What's Secure:**
- Your API credentials are stored as environment variables on Netlify's servers
- They're never exposed to the browser or client-side code
- The Netlify Function acts as a secure proxy to Selro

⚠️ **Important:**
- Never commit API credentials to your Git repository
- Always use environment variables for sensitive data
- Regularly rotate your API keys for security

## Next Steps

Once deployed successfully:

1. **Bookmark your site URL** for easy access
2. **Test all features** including:
   - Order loading from Selro
   - QR code scanning
   - Voice announcements
   - CSV upload
   - Stock tracking

3. **Train your team** on using the deployed application

4. **Monitor usage** through Netlify's analytics

## Summary

Your OrderPick application is now:
- ✅ Deployed to Netlify
- ✅ Connected to Selro API securely
- ✅ Accessible from any device with internet
- ✅ Automatically updated when you push changes to GitHub

The Selro integration will now work because the Netlify Functions can securely access your API credentials and make requests to Selro on behalf of your application.