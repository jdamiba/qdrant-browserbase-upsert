# Pitchfork Album Reviews Vector Search

This project uses Browserbase and Stagehand to scrape Pitchfork album reviews, generate embeddings using OpenAI's text-embedding-3-small model, and store them in Qdrant for semantic search capabilities.

## Features

- Automated scraping of Pitchfork album reviews using Browserbase and Stagehand
- Generation of embeddings for full review text using OpenAI's text-embedding-3-small model
- Storage of reviews and embeddings in Qdrant for vector similarity search
- Unique UUID-based identification for each review
- Browser-like behavior to avoid detection
- Error handling and graceful failure recovery

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key
- Browserbase API key and Project ID
- Qdrant API key and URL

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pitchfork-reviews-vector-search
```

2. Install dependencies:

```bash
npm install
```

## Usage

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

3. Click the "Run Stagehand" button to start the review collection process

The application will:

- Navigate to predefined Pitchfork album review URLs
- Extract the full review content
- Generate embeddings for the review text
- Store the reviews and embeddings in Qdrant

## Project Structure

- `app/api/stagehand/main.ts` - Main scraping and processing logic
- `app/lib/qdrant.ts` - Qdrant client and collection management
- `app/page.tsx` - Frontend interface
- `stagehand.config.ts` - Browserbase and Stagehand configuration

## Adding More Reviews

To add more reviews, update the `ALBUM_REVIEW_URLS` array in `app/api/stagehand/main.ts`:

```typescript
const ALBUM_REVIEW_URLS = [
  "https://pitchfork.com/reviews/albums/your-review-url-1/",
  "https://pitchfork.com/reviews/albums/your-review-url-2/",
  // Add more URLs as needed
];
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Browserbase](https://browserbase.com/) - Browser automation
- [Stagehand](https://docs.stagehand.dev/) - AI-powered browser automation
- [OpenAI](https://openai.com/) - Text embeddings
- [Qdrant](https://qdrant.tech/) - Vector database
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Zod](https://zod.dev/) - Schema validation

## License

MIT
