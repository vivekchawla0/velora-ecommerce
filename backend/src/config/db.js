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
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/velora';
    
    // Attempt connecting to configured MongoDB URI
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
      return conn;
    } catch (primaryErr) {
      console.log(`[Database] Local MongoDB not detected at ${mongoUri}. Starting In-Memory MongoDB Server...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-Memory MongoDB running at: ${memoryUri}`);
      return conn;
    }
  } catch (error) {
    console.error(`[Database Error] Fatal startup connection error: ${error.message}`);
    process.exit(1);
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
