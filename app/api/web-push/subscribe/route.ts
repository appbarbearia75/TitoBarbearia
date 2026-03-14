import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, userId, clientId, clientPhone, barbershopId, clientName } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      );
    }

    let resolvedClientId = clientId;

    // Resolve or create Client if phone and barbershopId are provided
    if (!resolvedClientId && clientPhone && barbershopId) {
       const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('barbershop_id', barbershopId)
        .eq('phone', clientPhone)
        .single();
        
       if (existingClient) {
         resolvedClientId = existingClient.id;
       } else {
         const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
               barbershop_id: barbershopId,
               phone: clientPhone,
               name: clientName || 'Visitante'
            })
            .select('id')
            .single();
         if (!clientError && newClient) {
            resolvedClientId = newClient.id;
         }
       }
    }

    if (!userId && !resolvedClientId) {
      return NextResponse.json(
        { error: 'User mapping failed: Either userId or client data is required.' },
        { status: 400 }
      );
    }

    const { endpoint, keys: { p256dh, auth } } = subscription;

    // Upsert or insert subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId || null,
        client_id: resolvedClientId || null,
        endpoint,
        p256dh,
        auth,
      });

    if (error) {
      console.error('Error saving subscription:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscription saved successfully' });
  } catch (error: any) {
    console.error('Error in subscribe route:', error);
    return NextResponse.json(
      { error: error?.message || 'Server Error' },
      { status: 500 }
    );
  }
}

