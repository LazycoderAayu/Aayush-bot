import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Database se connect karo
  await connectDB();

  if (req.method === 'POST') {
    const { email, name } = req.body;

    try {
      // 2. MongoDB mein user ko Update ya Create (Upsert) karo
      const user = await User.findOneAndUpdate(
        { email }, 
        { name, isOnline: true, lastActive: new Date() },
        { upsert: true, new: true }
      );
      return res.status(200).json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ error: "Database error" });
    }
  } else {
    res.status(405).json({ message: "Only POST requests allowed" });
  }
}
