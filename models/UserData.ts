import mongoose, { Schema, Document } from 'mongoose';

export interface IUserData extends Document {
  user: mongoose.Types.ObjectId;
  subjects: any[];
  logs: any[];
  sessions: any[];
  tasks: any[];
  tests: any[];
  goals: any[];
  achievements: any[];
  settings: any;
  notes: any[];
  timerState: any;
  lastActive: Date;

  // Leaderboard & Streak Fields
  dailyStudyMinutes: number;
  dailyStudyDate: string; // YYYY-MM-DD
  
  weeklyStudyMinutes: number;
  weeklyStudyDate: string; // YYYY-WW
  
  monthlyStudyMinutes: number;
  monthlyStudyDate: string; // YYYY-MM
  
  totalStudyMinutes: number;
  
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
}

const UserDataSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    subjects: { type: Schema.Types.Mixed, default: [] },
    logs: { type: Schema.Types.Mixed, default: [] },
    sessions: { type: Schema.Types.Mixed, default: [] },
    tasks: { type: Schema.Types.Mixed, default: [] },
    tests: { type: Schema.Types.Mixed, default: [] },
    goals: { type: Schema.Types.Mixed, default: [] },
    achievements: { type: Schema.Types.Mixed, default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
    notes: { type: Schema.Types.Mixed, default: [] },
    timerState: { type: Schema.Types.Mixed, default: null },
    lastActive: { type: Date, default: Date.now },

    dailyStudyMinutes: { type: Number, default: 0 },
    dailyStudyDate: { type: String, default: '' },

    weeklyStudyMinutes: { type: Number, default: 0 },
    weeklyStudyDate: { type: String, default: '' },

    monthlyStudyMinutes: { type: Number, default: 0 },
    monthlyStudyDate: { type: String, default: '' },

    totalStudyMinutes: { type: Number, default: 0 },

    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: { type: String, default: '' }
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized leaderboard sorting
UserDataSchema.index({ dailyStudyDate: 1, dailyStudyMinutes: -1 });
UserDataSchema.index({ weeklyStudyDate: 1, weeklyStudyMinutes: -1 });
UserDataSchema.index({ monthlyStudyDate: 1, monthlyStudyMinutes: -1 });
UserDataSchema.index({ totalStudyMinutes: -1 });

const UserData: mongoose.Model<IUserData> = (mongoose.models.UserData as mongoose.Model<IUserData>) || mongoose.model<IUserData>('UserData', UserDataSchema);

export default UserData;
