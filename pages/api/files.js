import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { user } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .storage
      .from('your-bucket-name') // Replace with your bucket name
      .list(`uploads/${user.id}`); // Assuming files are stored under user ID

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}