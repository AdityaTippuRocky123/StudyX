import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  lastLogin?: Date;
  studyStreak: number;
  totalStudyHours: number;
  averageTestScore: number;
  completedTasks: number;
  achievements: string[]; // array of unlocked achievement IDs
  settings: {
    theme: 'dark' | 'light' | 'amoled';
    accentColor: string;
    pomodoroFocus: number;
    pomodoroShortBreak: number;
    pomodoroLongBreak: number;
    notificationsEnabled: boolean;
    alarmSound: 'digital' | 'bell' | 'zen' | 'off';
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    studyStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalStudyHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageTestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    achievements: {
      type: [String],
      default: [],
    },
    settings: {
      theme: {
        type: String,
        enum: ['dark', 'light', 'amoled'],
        default: 'dark',
      },
      accentColor: {
        type: String,
        default: '#3b82f6', // Indigo/Blue hex color code
      },
      pomodoroFocus: {
        type: Number,
        default: 25, // default Pomodoro focus duration in minutes
      },
      pomodoroShortBreak: {
        type: Number,
        default: 5, // default short break duration in minutes
      },
      pomodoroLongBreak: {
        type: Number,
        default: 15, // default long break duration in minutes
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      alarmSound: {
        type: String,
        enum: ['digital', 'bell', 'zen', 'off'],
        default: 'digital',
      },
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// Hash the password before saving
UserSchema.pre('save', async function (this: any, next: any) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password || '');
};

// Prevent compiling model multiple times during hot-reloads/Vite server restarts
const User: mongoose.Model<IUser> = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
