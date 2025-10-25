import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    const { method } = req;

    if (method === 'POST') {
        const { email, password, action } = req.body;

        if (action === 'login') {
            const { user, error } = await supabase.auth.signIn({ email, password });
            if (error) return res.status(401).json({ error: error.message });
            return res.status(200).json({ user });
        } else if (action === 'signup') {
            const { user, error } = await supabase.auth.signUp({ email, password });
            if (error) return res.status(401).json({ error: error.message });
            return res.status(200).json({ user });
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}