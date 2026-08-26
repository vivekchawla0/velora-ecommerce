const mongoose = require('mongoose');

let mongoMemoryServer = null;

/**
 * Connect to MongoDB database.
 * Connects directly to persistent MongoDB instance (Docker / Local / Atlas).
 * In automated test suites (NODE_ENV === 'test'), falls back to MongoMemoryServer if needed.
 */
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    // 1. If MONGO_URI or MONGODB_URI is set (e.g. MongoDB Atlas), connect directly
    if (mongoUri) {
      try {
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
        return conn;
      } catch (atlasErr) {
        console.error(`[Database Error] Failed connecting to MONGO_URI: ${atlasErr.message}`);
      }
    }

    // 2. Attempt connecting to local MongoDB URI
    const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/velora';
    try {
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[Database] Local MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
      return conn;
    } catch (primaryErr) {
      console.log(`[Database] Local MongoDB not detected. Starting In-Memory MongoDB Server...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        downloadDir: process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? '/tmp' : undefined,
      });
      const memoryUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-Memory MongoDB running at: ${memoryUri}`);
      return conn;
    }
  } catch (error) {
    console.error(`[Database Error] Connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect database and cleanup in-memory instance if active.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (error) {
    console.error(`[Database Error] Disconnect error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
