# Deployment Guide for Resume Optimizer

This guide provides step-by-step instructions for deploying the Resume Optimizer application to Vercel.

## Prerequisites

- A Vercel account
- A PostgreSQL database (e.g., Neon, Supabase, or any PostgreSQL provider)
- OAuth credentials for Google, Twitter, and LinkedIn
- Node.js 18 or higher

## Environment Variables

The following environment variables are required for deployment:

### Authentication

- `NEXTAUTH_URL`: The URL of your deployed application
- `NEXTAUTH_SECRET`: A secret string used to encrypt cookies

### Database

- `DATABASE_URL`: PostgreSQL connection string

### OAuth Providers

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `TWITTER_CLIENT_ID`: Twitter OAuth client ID
- `TWITTER_CLIENT_SECRET`: Twitter OAuth client secret
- `LINKEDIN_CLIENT_ID`: LinkedIn OAuth client ID
- `LINKEDIN_CLIENT_SECRET`: LinkedIn OAuth client secret

### Email Configuration

- `EMAIL_SERVER_HOST`: SMTP server host
- `EMAIL_SERVER_PORT`: SMTP server port
- `EMAIL_SERVER_USER`: SMTP server username
- `EMAIL_SERVER_PASSWORD`: SMTP server password
- `EMAIL_FROM`: Email address to send from

### Admin Configuration

- `ADMIN_EMAILS`: Comma-separated list of admin email addresses

### Stripe Configuration

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## Deployment Steps

1. **Prepare your database**:
   - Create a PostgreSQL database
   - Get the connection string

2. **Set up OAuth providers**:
   - Create OAuth applications for Google, Twitter, and LinkedIn
   - Configure the redirect URIs to point to your deployed application
   - Get the client IDs and secrets

3. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Configure the environment variables
   - Deploy the application

4. **Run database migrations**:
   - After deployment, run the migration script:
     \`\`\`
     npx prisma migrate deploy
     \`\`\`

5. **Verify deployment**:
   - Visit the health check endpoint: `/api/health`
   - Test the authentication flow
   - Check the database connection

## Troubleshooting

If you encounter deployment issues, check the following:

1. **Environment variables**: Ensure all required environment variables are set
2. **Database connection**: Verify the database connection string is correct
3. **OAuth configuration**: Check the OAuth redirect URIs are correctly configured
4. **Build logs**: Review the build logs for any errors
5. **Runtime logs**: Check the runtime logs for any errors

For more detailed diagnostics, run the deployment diagnostics script:
\`\`\`
npx ts-node scripts/deployment-diagnostics.ts
\`\`\`

## Support

If you need help with deployment, please open an issue on the GitHub repository or contact the maintainers.
