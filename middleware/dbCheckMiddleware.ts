import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { dbConnectionError } from '../config/db';

export const verifyDatabaseConnection = (req: Request, res: Response, next: NextFunction): void => {
  // mongoose.connection.readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    let detail = 'Database connection is currently unavailable.';
    if (dbConnectionError) {
      if (dbConnectionError.includes('bad auth') || dbConnectionError.includes('Authentication failed')) {
        detail = 'Database connection failed: Authentication failed (bad auth). Your database user credentials or password in the MONGODB_URI are incorrect.';
      } else {
        detail = `Database connection failed: ${dbConnectionError}`;
      }
    }

    console.error('Database query blocked: Mongoose is not connected (readyState: ' + mongoose.connection.readyState + '). Detail: ' + detail);
    res.status(503).json({
      error: `${detail} Please click the gear/settings icon in AI Studio, select "Env Variables", and update MONGODB_URI with the correct MongoDB connection string.`
    });
    return;
  }
  next();
};
