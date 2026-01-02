# Supabase Storage Setup Guide

Complete guide to set up Supabase Storage for document uploads in the Visa Agent application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com if you don't have one)
- Node.js and npm installed
- Your frontend project ready

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in (or create an account)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: Choose a name (e.g., "visa-agent")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Select "Free" for development
4. Click **"Create new project"**
5. Wait for the project to be created (this takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

**Save these values** - you'll need them in the next step!

## Step 3: Create Storage Bucket

1. In your Supabase dashboard, go to **Storage** (in the left sidebar)
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `documents` (must match exactly)
   - **Public bucket**: Toggle this to **ON** (for development)
   - **File size limit**: 10 MB (or your preferred limit)
   - **Allowed MIME types**: Leave empty to allow all types, or specify: `application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`
4. Click **"Create bucket"**

## Step 4: Configure Storage Policies (Row Level Security)

Even though the bucket is public, you should set up proper RLS policies for better security.

### Option A: Public Access (Simplest - for development)

1. Go to **Storage** → Click on the `documents` bucket
2. Go to the **Policies** tab
3. Click **"New Policy"** → Select **"For full customization"**

#### Policy 1: Allow Public Uploads
- **Policy Name**: `Allow public uploads`
- **Allowed Operation**: `INSERT`
- **Policy Definition** (paste in the text box):
```
true
```
- Click **"Review"** → **"Save policy"**

#### Policy 2: Allow Public Downloads
- **Policy Name**: `Allow public downloads`
- **Allowed Operation**: `SELECT`
- **Policy Definition** (paste in the text box):
```
true
```
- Click **"Review"** → **"Save policy"**

### Option B: Authenticated Users Only (Recommended for production)

If you want to restrict access to authenticated users only:

#### Policy 1: Allow Authenticated Uploads
- **Policy Name**: `Allow authenticated uploads`
- **Allowed Operation**: `INSERT`
- **Policy Definition**:
```
bucket_id = 'documents' AND auth.role() = 'authenticated'
```

#### Policy 2: Allow Authenticated Downloads
- **Policy Name**: `Allow authenticated downloads`
- **Allowed Operation**: `SELECT`
- **Policy Definition**:
```
bucket_id = 'documents' AND auth.role() = 'authenticated'
```

**Note**: Option B requires Supabase Auth integration. For now, use Option A if you're using your own JWT authentication system.

## Step 5: Configure Frontend Environment Variables

1. In your `Frontend` directory, create a `.env` file (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace:
- `your-project-id.supabase.co` with your **Project URL** from Step 2
- `your-anon-key-here` with your **anon public** key from Step 2

**Example**:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 6: Verify Configuration

1. Make sure your `.env` file is in the `Frontend` directory
2. Restart your frontend development server:
   ```bash
   cd Frontend
   npm run dev
   ```
3. Check the browser console for any Supabase connection errors

## Step 7: Test Document Upload

1. Navigate to the Documents page in your application
2. Click **"Upload Document"**
3. Select a file and fill in the form
4. Click **"Upload Document"**
5. If successful, you should see the document appear in your list

## Troubleshooting

### Error: "new row violates row-level security policy"

**Solution**: Make sure you've created the RLS policies as described in Step 4. The bucket needs INSERT and SELECT policies.

### Error: "Failed to upload file"

**Possible causes**:
1. Check that your Supabase URL and anon key are correct in `.env`
2. Verify the bucket name is exactly `documents` (case-sensitive)
3. Check that the bucket is set to public (for development)
4. Ensure file size is under the bucket limit (default 10MB)

### Error: "Invalid API key"

**Solution**: 
- Double-check your `VITE_SUPABASE_ANON_KEY` in `.env`
- Make sure you're using the **anon public** key, not the service role key
- Restart your dev server after changing `.env`

### Dates showing as "Invalid date"

**Solution**: This is a frontend date parsing issue, not a Supabase issue. The backend should serialize dates correctly. Check that your backend server is running and restart it if needed.

## Security Notes

⚠️ **Important for Production**:
- The `anon` key is safe to use in frontend code (it's public)
- Never expose your `service_role` key in frontend code
- For production, consider implementing authenticated uploads with proper RLS policies
- Set up file size limits and MIME type restrictions
- Consider implementing virus scanning for uploaded files

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## Quick Reference

**Bucket Name**: `documents`  
**Required Environment Variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Storage Path Format**: `documents/{timestamp}_{filename}`
