import mongoose from "mongoose";

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
declare global { var mongooseCache: MongooseCache | undefined; }
const cache = global.mongooseCache ?? (global.mongooseCache = { conn: null, promise: null });

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable.");
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10000 });
  try { cache.conn = await cache.promise; }
  catch (error) { cache.promise = null; throw error; }
  return cache.conn;
}
