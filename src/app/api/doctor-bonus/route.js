import { createClient } from '@/utils/supabase/server'; // yoki client config qaysi bo‘lsa

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('doctor_bonus_analytics')
    .select('*');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
