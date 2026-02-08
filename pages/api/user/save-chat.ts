import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === 'POST') {
    const { email, message, role } = req.body; // role = 'user' or 'bot'

    try {
      // User dhundo aur uske 'chats' array mein naya message push karo
      await User.findOneAndUpdate(
        { email },
        { 
          $push: { 
            chats: { message, role, timestamp: new Date() } 
          },
          lastActive: new Date() 
        }
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save chat" });
    }
  }
}
