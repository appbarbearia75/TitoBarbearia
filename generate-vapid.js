const fs = require('fs');
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();
const envContent = `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nVAPID_SUBJECT=mailto:suporte@agendaeapp.com\n`;

fs.appendFileSync('.env.local', envContent);
fs.appendFileSync('.env', envContent);

console.log('Keys written to .env and .env.local');
