# 🔧 Render Environment Variables

Copy these environment variables to your Render backend service:

## Firebase Configuration

```
FIREBASE_PROJECT_ID=five-166d2
FIREBASE_PRIVATE_KEY_ID=c430d0b2138cf0c728398217ea0cf9576c502e6d
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCZK4MlEhmd93Ws\nkpU7vXaDiXXmLizZuUE5zE6GBZvKk9j9dDfRnbt3v8fWn1f4j4NtcD/Jx0W0xlnC\nklxZkBZcAA84ZmET+StGUYwZj9BsAkzZJ3ZeRMbC/zWKyHlKfvBHqge7t+H8N+yy\nHBSDgrwuDtJDA91SNbb4dhu/3d5WNqRwh2tOaEhSXrGAUIZA5917+gS54yq3tzGe\nnlO5TtYSyv3TWnn3kgL/mw4r8EROAMPPX7j4Mw/Wx4ABtrExxFgnbsbOw3coS7q7\nLmM9NjXOOq0gyyrK/tqxfCZDs1LmizSe81hQRqitL+fE4VjrlOcLpt7eKaS+lXrN\nzmXR+ZHRAgMBAAECggEACdQyercCINJn4TaYz/gU+lTgVXCCHUiXiGt1YIFMoX/C\nTWVfTZq3FHSgkMOx4/floaix1zNr5DFUQjmdJnwqCyZP07kyIpN7NOx3to41fDDb\nmJXBMURtksbIu0qpCeBCb/7XtzKSFFrMXBOUN2o0xCncUUOWuLdMsf32QuYsZdDL\naw+HenxXa/eRG6FF2WjEMiddRDEitOre6pfNhscq1dIaHxtmARXEv3egG5LYpgkX\nI41psj2n4Wea0YTsOnMh08izMeBb78+lcS0z67i96pZFoX0Y8qICAS3GQBlTzt9Y\nAU3hxAobGTMD2+XeFmfJSQCUUY0nE1/x0WGHuxCzvwKBgQDIgm5MaKrUcmn3hCni\n28SrUipHYg7DkodK9FiliiySSMHdjaLUssrlWigud8J2HfgfSedakIwmXN3JhxFG\n4ScM8y0MOSCOA6UrUw75UZaYCjLVd7c1GuliAT1eGgzLONjioC+l/9OXVXat6n5q\nPZ9PLfWBUcqzi23wNKU9fuCImwKBgQDDjzNqUVfsM4jqnDkNsrZwxpXaxYc4+FmE\ngpmtaxTld71X1hsqZe/RwQ/rtsyb0pwv+NIcQeO3Z58hVWCdNlNwOEXPAK17xmoo\nua7qRme6DTAoRTufQ9rfhX7iltImoqOQ7bJQKXAbZgWOiEFkc5cTqdZq106PSNLq\nqn0AuJtoAwKBgFFptENOFF7ifehEP4WfWkF9wTDuvbPnIQvsHrpIWkSjSiQdSEo4\ntm1dqAcGFW1ESeTaaxe4rU8+UcdsEjXHYcW+T0IxR+ihzkTDGsdcu1rMeUt3qmnj\nnXNvsW0uApfZYybRh8dNEqrVxrRjDCUzFCZgMNjrTvSL3n2zwowvoheVAoGAP6dZ\nAP5BNC0CH/uBxqepIsRA+tjYzv5nhO5Nv1jfkGGNTA3xAbf0e73vxLXXm9DN7f97\nxJ7d1FDyRxNXQ1Tvi9OFRX/e+C75VxA5kyAfmzu3tSPz6D9Z+u+lAXQ+Kz09KGt2\nYwlZ6FEo9d/8CQpm3ouls1kpxRHbNW8RCS8NxqkCgYAd5n1NwXXKqFm6MVBvnzWA\nww3SayqokYjGvK/atWUafRx5/d1bCAlSvDzoobZuY0lc41+O6WVmelNEUtfnvd1h\nTiDRC/LTclfZ/xYF1UMabb5O7cUSLk2XE0jFCqJDnqL6Yhtyo/WBzn/mPfsWOIvc\nktmHdnAqvSvisbuMCZjWmA==\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@five-166d2.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=103597068186732455324
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40five-166d2.iam.gserviceaccount.com
```

## Application Configuration

```
NODE_ENV=production
PORT=10000
```

## 🚀 How to Add These to Render:

1. **Go to your Render dashboard**
2. **Select your backend service**
3. **Go to Environment tab**
4. **Add each variable above** (one by one)
5. **Deploy** your service

## ⚠️ Important Notes:

- **Copy the FIREBASE_PRIVATE_KEY exactly** including the quotes and \n characters
- **Don't modify the private key format** - it must include the newlines as \n
- **All other variables** can be copied without quotes
- **After adding all variables**, trigger a new deployment

## 🔧 Alternative Method:

You can also add them via Render CLI or import from a .env file if you prefer.

## ✅ Verification:

After deployment, check your Render logs. You should see:
```
Environment: production
Using Firebase environment variables for production...
Firebase initialized successfully
```

If you see any authentication errors, double-check that all environment variables are set correctly, especially the FIREBASE_PRIVATE_KEY format.
