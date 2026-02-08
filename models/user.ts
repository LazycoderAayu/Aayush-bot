import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  name: String,
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  // Naya section: Chat history ke liye
  chats: [
    {
      role: String, // 'user' ya 'bot'
      message: String,
      timestamp: Date
    }
  ]
});

const User = models.User || model('User', UserSchema);
export default User;
