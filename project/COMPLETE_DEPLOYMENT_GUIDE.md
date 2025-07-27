# Complete Step-by-Step Guide: GitHub Account to Live OrderPick App

## Part 1: Create Your Free GitHub Account

### Step 1: Sign Up for GitHub
1. **Go to GitHub:**
   - Open your web browser
   - Go to [github.com](https://github.com)

2. **Create Account:**
   - Click the green "Sign up" button (top right)
   - Enter your email address
   - Create a password (make it strong!)
   - Choose a username (this will be part of your URLs)
   - Solve the verification puzzle
   - Click "Create account"

3. **Verify Your Email:**
   - Check your email inbox
   - Click the verification link GitHub sent you
   - This confirms your account

4. **Choose Your Plan:**
   - Select "Free" (this is perfect for our needs)
   - GitHub Free includes:
     - ✅ Unlimited public repositories
     - ✅ Unlimited private repositories
     - ✅ All features we need for deployment

### Step 2: Create Your First Repository
1. **From your GitHub homepage:**
   - Click the green "New" button (or the "+" icon → "New repository")

2. **Repository Settings:**
   - **Repository name:** `orderpick-app` (or any name you prefer)
   - **Description:** `Order picking assistant application`
   - **Visibility:** Select "Public" (required for free Netlify deployment)
   - **Initialize:** Leave all checkboxes UNCHECKED (we'll upload our existing files)
   - Click "Create repository"

3. **You'll see a page with instructions** - we'll use the "upload files" method

## Part 2: Upload Your OrderPick Code to GitHub

### Method 1: Using GitHub's Web Interface (Recommended for Beginners)

1. **Download Your Project:**
   - In this development environment, download all your project files
   - You should have files like: `package.json`, `src/`, `netlify/`, etc.

2. **Upload to GitHub:**
   - On your new repository page, click "uploading an existing file"
   - **Drag and drop ALL your project files** into the upload area
   - Or click "choose your files" and select all files
   - Make sure you include:
     - ✅ `package.json`
     - ✅ `src/` folder (with all components)
     - ✅ `netlify/` folder (with the functions)
     - ✅ `index.html`
     - ✅ `vite.config.ts`
     - ✅ `tailwind.config.js`
     - ✅ `netlify.toml`
     - ✅ All other files

3. **Commit Your Files:**
   - Scroll down to "Commit changes"
   - In the commit message box, type: `Initial commit - OrderPick application`
   - Click "Commit changes"

4. **Verify Upload:**
   - You should now see all your files in the repository
   - The main page should show your files like `package.json`, `src/`, etc.

### Method 2: Using Git Commands (If You Have Git Installed)

If you're comfortable with command line:

```bash
# Clone your new repository
git clone https://github.com/YOUR_USERNAME/orderpick-app.git
cd orderpick-app

# Copy all your project files into this folder
# Then add and commit them
git add .
git commit -m "Initial commit - OrderPick application"
git push origin main
```

## Part 3: Deploy to Netlify

### Step 1: Create Netlify Account
1. **Go to Netlify:**
   - Open [netlify.com](https://netlify.com)
   - Click "Sign up"

2. **Sign Up with GitHub:**
   - Click "Sign up with GitHub" (this makes everything easier)
   - You'll be redirected to GitHub
   - Click "Authorize Netlify" to connect your accounts
   - You'll be redirected back to Netlify

3. **Complete Netlify Setup:**
   - You might be asked for additional info (name, etc.)
   - Fill it out and continue

### Step 2: Deploy Your Site
1. **From Netlify Dashboard:**
   - Click "Add new site"
   - Select "Import an existing project"

2. **Connect to GitHub:**
   - Click "GitHub"
   - If prompted, authorize Netlify to access your repositories
   - You'll see a list of your GitHub repositories

3. **Select Your Repository:**
   - Find "orderpick-app" in the list
   - Click on it

4. **Configure Build Settings:**
   - **Site name:** You can change this or leave the auto-generated name
   - **Branch to deploy:** `main` (should be selected automatically)
   - **Build command:** `npm run build` (should be auto-detected)
   - **Publish directory:** `dist` (should be auto-detected)
   - **Advanced:** Leave empty for now
   - Click "Deploy site"

5. **Wait for Build:**
   - Netlify will start building your site
   - You'll see a build log with progress
   - This takes 2-5 minutes typically
   - When done, you'll get a URL like: `https://wonderful-name-123456.netlify.app`

### Step 3: Test Basic Deployment
1. **Click on your site URL**
2. **Your OrderPick app should load!**
3. **Try the basic features:**
   - The interface should work
   - You can upload HTML files
   - CSV upload should work
   - Settings modal should open

**Note:** Selro API won't work yet - we need to configure that next!

## Part 4: Configure Selro API Integration

### Step 1: Get Your Selro Credentials
1. **Log into your Selro account**
2. **Navigate to API settings:**
   - Go to "Channel Integration"
   - Click on "API" section
3. **Copy your credentials:**
   - **API Key:** Starts with `app4_key` (e.g., `app4_keyd1cb8bad-c750-437f-b722-071d9318dde9`)
   - **API Secret:** Starts with `app4_secret` (e.g., `app4_secretbbcdfc8c-bbd3-4e3e-adc0-2680ca8e98b6`)

### Step 2: Add Environment Variables to Netlify
1. **In your Netlify dashboard:**
   - Go to your site (click on the site name)
   - Click "Site settings" (in the top navigation)
   - In the left sidebar, click "Environment variables"

2. **Add SELRO_API_KEY:**
   - Click "Add a variable"
   - **Key:** `SELRO_API_KEY`
   - **Value:** Paste your Selro API key (the one starting with `app4_key`)
   - **Scopes:** Leave as "All scopes"
   - Click "Create variable"

3. **Add SELRO_API_SECRET:**
   - Click "Add a variable" again
   - **Key:** `SELRO_API_SECRET`
   - **Value:** Paste your Selro API secret (the one starting with `app4_secret`)
   - **Scopes:** Leave as "All scopes"
   - Click "Create variable"

4. **Verify Variables:**
   - You should now see both variables listed
   - The values will be hidden for security

### Step 3: Redeploy with New Environment Variables
1. **Trigger a new deployment:**
   - Go to "Deploys" tab (in the top navigation)
   - Click "Trigger deploy" button
   - Select "Deploy site"
   - Wait for the new deployment to complete (2-3 minutes)

## Part 5: Test Your Complete Application

### Step 1: Test Selro Connection
1. **Open your live site** (click the site URL)
2. **Open Settings:**
   - Click the gear icon (⚙️) in the top right
   - Go to the "Selro API" tab

3. **Enter API Credentials:**
   - **API Key:** Enter the same key you used in environment variables
   - **API Secret:** Enter the same secret you used in environment variables
   - Click "Test Connection"

4. **Verify Success:**
   - You should see "Connected Successfully" ✅
   - If you see an error, double-check your credentials

### Step 2: Load Orders from Selro
1. **After successful connection:**
   - You should see "All Orders" folder appear
   - Click on "All Orders" to select it
   - The app should start loading your orders from Selro

2. **Test Order Features:**
   - Orders should appear in the sidebar
   - Click on an order to view details
   - Test voice announcements
   - Try QR code scanning
   - Test marking orders as complete

### Step 3: Test Other Features
1. **CSV Upload:**
   - Go to Settings → CSV Upload tab
   - Upload a test CSV file
   - Verify orders load correctly

2. **Voice Settings:**
   - Go to Settings → Voice Control tab
   - Test different voice settings
   - Verify voice announcements work

3. **Stock Tracking:**
   - Mark some items for reorder
   - Check Settings → Items to Order tab
   - Verify tracking works

## Part 6: Customize Your Deployment

### Step 1: Change Your Site Name
1. **In Netlify dashboard:**
   - Go to "Site settings"
   - Click "Change site name"
   - Enter a custom name like: `yourcompany-orderpick`
   - Your new URL becomes: `https://yourcompany-orderpick.netlify.app`

### Step 2: Set Up Custom Domain (Optional)
If you own a domain name:
1. **In Netlify dashboard:**
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter your domain (e.g., `orderpick.yourcompany.com`)
   - Follow the DNS setup instructions

## Part 7: Ongoing Management

### Updating Your App
When you want to make changes:
1. **Update files in GitHub:**
   - Go to your GitHub repository
   - Edit files directly on GitHub, or
   - Upload new versions of files
   - Commit the changes

2. **Automatic Deployment:**
   - Netlify automatically detects changes
   - It rebuilds and deploys your site
   - Usually takes 2-5 minutes

### Monitoring Your App
1. **Netlify Dashboard:**
   - View deployment history
   - Check build logs
   - Monitor site analytics
   - View function logs

2. **GitHub Repository:**
   - Track all code changes
   - View commit history
   - Manage collaborators

## Troubleshooting Common Issues

### Issue 1: Build Fails
**Symptoms:** Deployment fails with build errors

**Solutions:**
1. Check the build log in Netlify
2. Ensure all files were uploaded to GitHub
3. Verify `package.json` is present and correct
4. Check that `netlify.toml` is in the repository

### Issue 2: Selro Connection Fails
**Symptoms:** "Connection failed" when testing Selro API

**Solutions:**
1. Verify environment variables are set correctly in Netlify
2. Check that you redeployed after adding environment variables
3. Confirm your Selro API credentials are active
4. Test credentials directly in Selro's API documentation

### Issue 3: Functions Don't Work
**Symptoms:** Selro integration fails, function errors

**Solutions:**
1. Ensure `netlify/functions/getSelroOrders.js` is in your repository
2. Check the Functions tab in Netlify dashboard
3. View function logs for specific errors
4. Verify environment variables are accessible to functions

### Issue 4: Site Loads but Features Don't Work
**Symptoms:** Basic site works but advanced features fail

**Solutions:**
1. Check browser console for JavaScript errors (F12 → Console)
2. Verify all files were uploaded correctly
3. Check that the build completed successfully
4. Test in different browsers

## Security Best Practices

### ✅ What's Secure:
- API credentials stored as environment variables
- Credentials never exposed to browser
- Netlify Functions act as secure proxy
- HTTPS encryption on all connections

### ⚠️ Important Security Notes:
- Never commit API credentials to GitHub
- Always use environment variables for secrets
- Regularly rotate API keys
- Monitor access logs

## Cost Breakdown

### GitHub Free:
- ✅ Unlimited public repositories
- ✅ Unlimited private repositories
- ✅ All features needed
- **Cost: $0/month**

### Netlify Free:
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ Functions included
- **Cost: $0/month**

### Total Cost: **$0/month** 🎉

## Success Checklist

By the end of this guide, you should have:

- ✅ Free GitHub account created
- ✅ OrderPick code uploaded to GitHub repository
- ✅ Free Netlify account created
- ✅ Site deployed and accessible via URL
- ✅ Selro API credentials configured
- ✅ Selro integration working
- ✅ All app features tested and working
- ✅ Custom site name set (optional)

## Getting Help

### Documentation:
- **GitHub:** [docs.github.com](https://docs.github.com)
- **Netlify:** [docs.netlify.com](https://docs.netlify.com)

### Community Support:
- **GitHub Community:** [github.community](https://github.community)
- **Netlify Community:** [answers.netlify.com](https://answers.netlify.com)

### Video Tutorials:
- Search YouTube for "GitHub for beginners"
- Search YouTube for "Deploy to Netlify"

## Next Steps

Once everything is working:

1. **Bookmark your live site URL**
2. **Train your team** on the deployed application
3. **Set up regular backups** (GitHub automatically backs up your code)
4. **Monitor usage** through Netlify analytics
5. **Plan for scaling** if you need more bandwidth/builds

Congratulations! You now have a professional, production-ready OrderPick application deployed to the cloud! 🚀