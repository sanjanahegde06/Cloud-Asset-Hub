import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        const { fileName } = req.body;

        const { user } = await supabase.auth.getUser();

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase.storage
            .from('your-bucket-name')
            .remove([`${user.id}/${fileName}`]);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: 'File deleted successfully' });
    } else {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}