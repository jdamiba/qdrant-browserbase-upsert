/**
 * 🤘 Welcome to Stagehand!
 *
 *
 * To edit config, see `stagehand.config.ts`
 *
 * In this quickstart, we'll be automating a browser session to show you the power of Playwright and Stagehand's AI features.
 *
 * 1. Go to https://docs.browserbase.com/
 * 2. Use `extract` to find information about the quickstart
 * 3. Use `observe` to find the links under the 'Guides' section
 * 4. Use Playwright to click the first link. If it fails, use `act` to gracefully fallback to Stagehand AI.
 */

import { Page, BrowserContext, Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import chalk from "chalk";
import dotenv from "dotenv";
import boxen from "boxen";
import { initCollection, addReview, MusicReviewSchema } from "@/app/lib/qdrant";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const chalkYellow = (msg: string) => chalk.hex("#FEC83C")(msg);

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// List of album review URLs to process
const ALBUM_REVIEW_URLS = [
  "https://pitchfork.com/reviews/albums/hiroshi-yoshimura-flora/",
  "https://pitchfork.com/reviews/albums/tyler-the-creator-call-me-if-you-get-lost-the-estate-sale/",
  "https://pitchfork.com/reviews/albums/charli-xcx-brat/",
  // Add more URLs as needed
];

// Common browser headers
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "max-age=0",
  "sec-ch-ua":
    '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  DNT: "1",
  Pragma: "no-cache",
  Referer: "https://pitchfork.com/",
};

export async function main({
  page,
  context,
  stagehand,
}: {
  page: Page;
  context: BrowserContext;
  stagehand: Stagehand;
}) {
  console.log(
    [
      `🤘 ${chalkYellow("Welcome to Stagehand!")}`,
      "",
      "Stagehand is a tool that allows you to automate browser interactions.",
      "Watch as this demo automatically performs the following steps:",
      "",
      `📍 Step 1: Process ${ALBUM_REVIEW_URLS.length} album reviews`,
      `📍 Step 2: Extract review content and store in Qdrant`,
    ].join("\n")
  );

  // Initialize Qdrant collection
  await initCollection();

  // Set up browser context with headers and viewport
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  // Set viewport to a common resolution
  await page.setViewportSize({ width: 1280, height: 800 });

  // Set extra headers for all requests
  await context.setExtraHTTPHeaders(BROWSER_HEADERS);

  // Process each review URL
  for (const reviewUrl of ALBUM_REVIEW_URLS) {
    console.log(`\nProcessing review: ${reviewUrl}`);

    // Add a small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Navigate to the review URL
      await page.goto(reviewUrl, {
        timeout: 30000,
        waitUntil: "domcontentloaded",
      });

      // Wait for the review content to be visible
      await page.waitForSelector("article", { timeout: 10000 });

      // Extract the review content
      const review = await page.extract({
        instruction:
          "Extract the album review details including title, artist, score, full review text (including all paragraphs), and date. Make sure to get the complete review text, not just a summary.",
        schema: z.object({
          title: z.string(),
          artist: z.string(),
          score: z.number(),
          review_text: z.string(),
          url: z.string(),
          date: z.string(),
        }),
      });

      // Generate a UUID for the review
      const reviewId = uuidv4();

      // Generate embedding for the review text - include all review content
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: review.review_text, // Use the full review text for embedding
      });

      // Add review to Qdrant with UUID as ID
      await addReview(
        {
          ...review,
          id: reviewId,
        },
        response.data[0].embedding
      );

      announce(
        `Added review: ${chalkYellow(review.title)} by ${chalkYellow(
          review.artist
        )} (Score: ${chalkYellow(review.score.toString())})`,
        "Review Added"
      );
    } catch (error) {
      console.error(`Failed to process review at ${reviewUrl}:`, error);
      // Continue with the next review even if one fails
      continue;
    }
  }

  // Close the browser
  await stagehand.close();

  console.log(
    [
      "To recap, here are the steps we took:",
      `1. We processed ${ALBUM_REVIEW_URLS.length} album reviews`,
      "2. We extracted the review content and stored it in Qdrant",
    ].join("\n\n")
  );
}

function announce(message: string, title?: string) {
  console.log(
    boxen(message, {
      padding: 1,
      margin: 3,
      title: title || "Stagehand",
    })
  );
}
