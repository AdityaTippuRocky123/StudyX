import mongoose from 'mongoose';

export let dbConnectionError: string | null = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    dbConnectionError = 'MONGODB_URI environment variable is missing.';
    console.error('Error: MONGODB_URI environment variable is missing.');
    console.error('Please configure MONGODB_URI in your environment variables or .env file.');
    console.warn('Warning: Express server will remain running to serve the client-side app, but database operations will be blocked. Please configure MONGODB_URI in the Settings panel.');
    return;
  }

  try {
    // Disable query buffering so Mongoose queries fail immediately instead of hanging for 10 seconds
    mongoose.set('bufferCommands', false);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout instead of the default 30 seconds
    });
    dbConnectionError = null;
    console.log('Successfully connected to MongoDB Atlas via Mongoose.');
  } catch (error: any) {
    dbConnectionError = error?.message || 'Unknown connection error';
    console.error('Failed to connect to MongoDB Atlas:', error);
    
    const errorMessage = error?.message || '';
    if (errorMessage.includes('bad auth') || errorMessage.includes('Authentication failed')) {
      console.error('\n========================================================================');
      console.error('🔴 MONGODB ATLAS AUTHENTICATION FAILURE DETECTED');
      console.error('========================================================================');
      console.error('Your MONGODB_URI connection string is rejected by the database cluster.');
      console.error('\nHow to fix this:');
      console.error('1. Check password special characters:');
      console.error('   If your database password has characters like @, :, /, +, ?, or #, you MUST');
      console.error('   encode them using URL encoding. For example:');
      console.error('     @ -> %40');
      console.error('     : -> %3A');
      console.error('     / -> %2F');
      console.error('     + -> %2B');
      console.error('2. Verify Database User:');
      console.error('   Go to your MongoDB Atlas Console under Security -> Database Access.');
      console.error('   Make sure the user exists, has "Read and write to any database" role,');
      console.error('   and that you are using the correct password.');
      console.error('3. Check Database Name:');
      console.error('   Ensure the database name in the URI path is correct.');
      console.error('4. Update environment variables:');
      console.error('   Open the "Settings" menu in the AI Studio panel, select Env Variables,');
      console.error('   and update the MONGODB_URI value with the corrected connection string.');
      console.error('========================================================================\n');
    }

    console.warn('Warning: Express server will remain running to serve the client-side app, but database operations will be blocked. Please verify and update your connection string in the Settings panel.');
  }
}
