# Adding a Custom Domain (`englishwitharik.com`)

To add your custom domain and ensure authentication works correctly, follow these three steps.

## 1. Vercel (Hosting Configuration)
1. Go to your **Vercel Dashboard**.
2. Select your project (`english-tests-platform` or similar).
3. Go to **Settings** > **Domains**.
4. Enter `englishwitharik.com` and click **Add**.
5. Vercel will provide DNS records:
   - **Type**: `A` | **Name**: `@` | **Value**: `76.76.21.21`
   - **Type**: `CNAME` | **Name**: `www` | **Value**: `cname.vercel-dns.com`
6. Log in to your domain registrar (e.g., GoDaddy, Namecheap) and add/update these records.

## 2. Firebase Authentication (Whitelisting)
*If you skip this, users will see `auth/unauthorized-domain` errors.*

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Navigate to **Authentication** > **Settings** tab.
4. Scroll down to **Authorized domains**.
5. Click **Add domain**.
6. Enter `englishwitharik.com` and click **Add**.

## 3. Google Cloud Console (OAuth)
*Required if using "Sign in with Google".*

1. Go to [Google Cloud Console > API & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2. Find your **OAuth 2.0 Client ID** (usually named "Web client (auto created by Google Service)").
3. Under **Authorized JavaScript origins**, add:
   - `https://englishwitharik.com`
   - `https://www.englishwitharik.com`
4. Under **Authorized redirect URIs**, add:
   - `https://englishwitharik.com/__/auth/handler`
   - `https://www.englishwitharik.com/__/auth/handler`
5. Click **Save**.

## Verification
After completing these steps, wait a few minutes for DNS propagation, then try logging in at `https://englishwitharik.com/login`.
