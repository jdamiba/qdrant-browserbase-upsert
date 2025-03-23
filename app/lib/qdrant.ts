import { QdrantClient } from "@qdrant/js-client-rest";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Schema for music reviews
export const MusicReviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  score: z.number(),
  review_text: z.string(),
  url: z.string(),
  date: z.string(),
});

export type MusicReview = z.infer<typeof MusicReviewSchema>;

// Initialize Qdrant client
const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

// Collection name for music reviews
const COLLECTION_NAME = "music_reviews";

// Initialize collection with proper schema
export async function initCollection() {
  try {
    // Check if collection exists
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );

    if (!exists) {
      // Create collection with proper configuration
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536, // OpenAI embedding size
          distance: "Cosine",
        },
      });
      console.log(`Created collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
    }
  } catch (error) {
    console.error("Error initializing collection:", error);
    throw error;
  }
}

// Add a review to the collection
export async function addReview(review: MusicReview, embedding: number[]) {
  try {
    await client.upsert(COLLECTION_NAME, {
      points: [
        {
          id: review.id, // Use UUID as unique ID
          vector: embedding,
          payload: review,
        },
      ],
    });
    console.log(`Added review: ${review.title} by ${review.artist}`);
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
}

// Search for similar reviews
export async function searchReviews(query: number[], limit: number = 5) {
  try {
    const results = await client.search(COLLECTION_NAME, {
      vector: query,
      limit,
      with_payload: true,
    });
    return results;
  } catch (error) {
    console.error("Error searching reviews:", error);
    throw error;
  }
}
