# Draw it, Pass it! 🎨

A fun multiplayer web game inspired by Chinese Pictionary/Telestrations. Players alternate between writing phrases and drawing pictures, creating hilarious chains of misinterpretation!

## Features

- ✨ Create temporary game lobbies with 6-digit codes
- 👥 Drag-and-drop player ordering (leader only)
- ✍️ Mobile-optimized drawing canvas
- 📱 Fully responsive design
- 🎉 Reveal results pack-by-pack
- 🔒 Auto-cleanup: lobbies expire after 24 hours

## How to Play

1. **Create a Lobby**: One player creates a game and shares the 6-digit code
2. **Join**: Friends join using the code
3. **Order Players**: Leader arranges players to match seating order
4. **Start**: Each player writes a phrase to begin
5. **Draw & Write**: Alternate between drawing and describing
6. **Reveal**: View the hilarious results!

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel KV** (persistent storage)
- **Vercel** (deployment)
- **dnd-kit** (drag & drop)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Required: Vercel KV Setup

The app requires Vercel KV for persistent storage in production. Follow these steps:

1. Go to your project on Vercel Dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** and select **KV**
4. Follow the prompts to create your KV database
5. Vercel will automatically add the required environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.)
6. Redeploy your application

**For local development**, the app will automatically use in-memory storage if Vercel KV environment variables are not configured.

### Optional Setup

- **Vercel Blob**: For optimized drawing storage (currently using base64)

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

ISC
