import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("aayush_bot");
    // Saare users nikalo aur latest active wale ko sabse upar rakho
    const users = await db.collection("users").find({}).sort({ lastActive: -1 }).toArray();
    return res.status(200).json(users);
  } catch (e) {
    return res.status(500).json({ error: "Cloud fetch failed" });
  }
}
