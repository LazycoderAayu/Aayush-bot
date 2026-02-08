import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  name: String,
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now }
});

// TypeScript ke liye model checking
const User = models.User || model('User', UserSchema);
export default User;
