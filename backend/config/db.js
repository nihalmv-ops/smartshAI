import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node.js SRV resolution issue on Windows ISP DNS
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if DNS server configuration is locked
}

const connectDB = async () => {
  let primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartmart_ai';
  // If Atlas URI without database name, append database name
  if (primaryUri.startsWith('mongodb+srv://') && !primaryUri.includes('mongodb.net/')) {
    primaryUri = primaryUri.replace('mongodb.net', 'mongodb.net/smartmart_ai?retryWrites=true&w=majority');
  }

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // If Atlas connection failed due to IP whitelist, attempt fallback to local MongoDB
    if (primaryUri.includes('mongodb+srv') || primaryUri.includes('mongodb.net')) {
      console.warn(`🔄 Attempting fallback to local MongoDB at mongodb://127.0.0.1:27017/smartmart_ai...`);
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/smartmart_ai', {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`✅ Connected to Local MongoDB: ${localConn.connection.host} (database: smartmart_ai)`);
        console.log(`💡 To switch to MongoDB Atlas, whitelist your IP in Atlas Network Access -> Add IP -> 0.0.0.0/0`);
        return localConn;
      } catch (localError) {
        console.error(`❌ Local MongoDB also unavailable: ${localError.message}`);
      }
    }

    console.warn(`⚠️ Note: Ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP -> Allow Access From Anywhere / 0.0.0.0/0) or that local MongoDB is running.`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
