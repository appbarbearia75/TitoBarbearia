async function run() {
    try {
        const url = 'https://vuaayfuhqbrkvwutcidw.supabase.co/rest/v1/bookings?select=*&order=created_at.desc&limit=1';
        const res = await fetch(url, { headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YWF5ZnVocWJya3Z3dXRjaWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTI0MzAsImV4cCI6MjA4NjQyODQzMH0.PaNXpJEBJpYx_UWp0GwXinLA346Pr75YRuA09RK-Dno' } });
        const data = await res.json();
        console.log(JSON.stringify(data[0], null, 2));
    } catch (e) { console.error(e) }
}
run();
