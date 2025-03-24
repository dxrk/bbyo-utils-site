import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In production, use a static variable to manage the connection
if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to avoid opening multiple connections
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client
      .connect()
      .catch((err: Error) => {
        console.error("Failed to connect to MongoDB:", err);
        throw err;
      });
  }

  if (!globalWithMongo._mongoClientPromise) {
    throw new Error("Failed to initialize MongoDB connection");
  }

  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, create a new connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((err: Error) => {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  });
}

export default clientPromise;

/**
 * Connect to MongoDB and return the database instance
 * @returns MongoDB database instance
 */
export async function connectToMongoDB() {
  try {
    const client = await clientPromise;
    return client.db();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Unable to connect to database");
  }
}
