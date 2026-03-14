import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWebPush } from '@/lib/web-push';

export async function POST(request: Request) {
  try {
    const { userId, clientPhone, barbershopId, title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    let subscriptions = [];

    // Notify Provider/Owner
    if (userId) {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);
      
      if (data) subscriptions.push(...data);
    }

    // Notify Client
    if (clientPhone && barbershopId) {
      // Find client id
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('barbershop_id', barbershopId)
        .eq('phone', clientPhone)
        .single();
      
      if (existingClient) {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('client_id', existingClient.id);
        
        if (data) subscriptions.push(...data);
      }
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found for the given criteria.' });
    }

    const payload = {
      title,
      body,
      icon: '/ICON-PNG.png',
      url: url || '/'
    };

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        const res = await sendWebPush(pushSub, payload);
        if (res && res.success === false && res.error) {
           // Maybe delete expired subscription? Status 410 means Unsubscribed
           if ((res.error as any).statusCode === 410 || (res.error as any).statusCode === 404) {
             console.log('Subscription expired, removing from DB.', sub.endpoint);
             await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
           }
        }
        return res;
      })
    );

    return NextResponse.json({ success: true, sentCount: subscriptions.length, results });
  } catch (error: any) {
    console.error('Error in send Push logic:', error);
    return NextResponse.json({ error: error?.message || 'Server Error' }, { status: 500 });
  }
}
