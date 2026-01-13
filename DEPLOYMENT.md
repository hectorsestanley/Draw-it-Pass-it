# Deployment Guide

## Quick Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit: Draw it, Pass it game"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and deploy!

3. **Share the URL**
   - Once deployed, share the Vercel URL with your friends
   - They can access the game on their phones

## Optional: Add Custom Domain

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Optional: Set up Vercel KV (for production persistence)

Currently, the game uses in-memory storage which resets on server restart. For production, you can add Vercel KV:

1. In Vercel dashboard, go to "Storage"
2. Create a new KV database
3. Connect it to your project
4. Update `lib/storage.ts` to use `@vercel/kv` instead of in-memory storage

### Example Vercel KV Integration

Install the package:
```bash
npm install @vercel/kv
```

Update `lib/storage.ts`:
```typescript
import { kv } from '@vercel/kv'

export const storage = {
  async getLobby(code: string) {
    return await kv.get(`lobby:${code}`)
  },
  async setLobby(code: string, lobby: Lobby) {
    await kv.set(`lobby:${code}`, lobby, { ex: 86400 }) // 24h expiry
  },
  // ... other methods
}
```

## Optional: Set up Vercel Blob (for drawing storage)

Currently, drawings are stored as base64 strings. For better performance with Vercel Blob:

1. In Vercel dashboard, go to "Storage"
2. Create a new Blob store
3. Connect it to your project
4. Update drawing submission to upload to Blob storage

## Environment Variables

No environment variables are required for the basic setup!

## Testing

Test the deployment:
1. Create a lobby on your phone
2. Have friends join with the lobby code
3. Play through a complete game
4. Check the results page

## Troubleshooting

**Problem**: Game state resets between rounds
- **Solution**: The in-memory storage is working as designed. For persistence, set up Vercel KV (see above)

**Problem**: Drawings look blurry
- **Solution**: This is expected with base64 storage. For better quality, set up Vercel Blob storage

**Problem**: Players can't join
- **Solution**: Check that the lobby code is correct and the lobby hasn't expired (24h limit)
