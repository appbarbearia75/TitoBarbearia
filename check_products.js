const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vuaayfuhqbrkvwutcidw.supabase.co', 'sb_publishable_-qWiT8Yk4ZjS9h0LcfbUjA_HXs5sdWk');

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) console.error(error);
  else if(data && data.length > 0) console.log('Products Columns:', Object.keys(data[0]));
  else console.log('No data found in products');
}
check();
