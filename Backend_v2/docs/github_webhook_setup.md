# GitHub Webhook Setup

This document explains how to set up GitHub webhooks to automatically save pull requests to your Neurade Backend v2 application.

## Overview

The webhook system automatically:
- Creates PR records when pull requests are opened, synchronized, or reopened
- Updates PR status when pull requests are closed
- Links PRs to courses based on the GitHub repository URL

## Environment Variables

Add these to your `.env` file:

```env
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
```

## Webhook Endpoint

Your webhook endpoint will be available at:
```
POST /webhook/github
```

## Setting up GitHub Webhook

### 1. Generate a Webhook Secret
Generate a secure random string to use as your webhook secret. You can use:
```bash
openssl rand -hex 32
```

### 2. Configure GitHub Webhook
1. Go to your GitHub repository
2. Navigate to **Settings** > **Webhooks**
3. Click **Add webhook**
4. Configure the webhook:
   - **Payload URL**: `https://your-domain.com/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Use the secret you generated
   - **Events**: Select **Pull requests** only
   - **Active**: Check this box

### 3. Test the Webhook
1. Create a test pull request in your repository
2. Check your application logs to see if the webhook was received
3. Verify that a PR record was created in your database

## Webhook Events Handled

- `pull_request.opened` - Creates a new PR record
- `pull_request.synchronize` - Updates existing PR record
- `pull_request.reopened` - Updates existing PR record
- `pull_request.closed` - Updates PR status to "closed"

## Security

The webhook endpoint verifies GitHub signatures using HMAC-SHA256 to ensure requests are coming from GitHub. Make sure to:

1. Use a strong webhook secret
2. Keep your webhook secret secure
3. Use HTTPS for your webhook endpoint

## Troubleshooting

### Common Issues

1. **"Invalid signature" error**
   - Check that your `GITHUB_WEBHOOK_SECRET` environment variable matches the secret in GitHub
   - Ensure the webhook is using the correct content type

2. **"No course found for GitHub URL" error**
   - Make sure the course exists in your database
   - Verify the GitHub URL in the course matches the repository URL exactly

3. **Webhook not receiving events**
   - Check that the webhook is active in GitHub
   - Verify the payload URL is accessible
   - Check your server logs for any errors

### Debugging

Enable debug logging by setting:
```env
LOG_LEVEL=5
```

This will show detailed webhook processing logs.

## Database Schema

The webhook creates records in the `prs` table with these fields:
- `course_id` - Links to the course
- `pr_name` - Pull request title
- `pr_description` - Pull request body
- `status` - "open" or "closed"
- `pr_number` - GitHub PR number
- `created_at` / `updated_at` - Timestamps 