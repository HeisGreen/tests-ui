# Supabase Storage Setup Guide

## Fixing "new row violates row-level security policy" Error

This error occurs because Supabase Storage buckets have Row Level Security (RLS) enabled by default. You need to configure the storage bucket policies.

## Option 1: Make Bucket Public (Simplest - for development)

1. Go to your Supabase Dashboard → Storage
2. Click on the `documents` bucket
3. Go to the **Policies** tab
4. Click **New Policy** → **For full customization**
5. Create two policies:

### Policy 1: Allow Public Uploads
- **Policy Name**: Allow public uploads
- **Allowed Operation**: INSERT
- **Policy Definition**:
```sql
true
```

### Policy 2: Allow Public Downloads
- **Policy Name**: Allow public downloads  
- **Allowed Operation**: SELECT
- **Policy Definition**:
```sql
true
```

**Note**: This makes the bucket completely public. Anyone can upload/download files. Only use this for development!

## Option 2: Authenticated Users Only (Recommended for production)

If you want to use Supabase Auth (instead of your current JWT auth), you can set up policies that check authentication:

### Policy 1: Allow Authenticated Uploads
```sql
bucket_id = 'documents' AND auth.role() = 'authenticated'
```

### Policy 2: Allow Authenticated Downloads
```sql
bucket_id = 'documents' AND auth.role() = 'authenticated'
```

## Option 3: Disable RLS (Quick fix for development)

1. Go to Storage → `documents` bucket
2. Click **Settings**
3. Toggle **Public bucket** to ON

This disables RLS entirely for this bucket.

## Current Setup

The app uses your own JWT authentication system, not Supabase Auth. For now, **Option 1 or Option 3** will work best until you integrate Supabase Auth.

## After Setup

1. Restart your frontend dev server
2. Try uploading a document again
3. The error should be resolved
