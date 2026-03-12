
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const date = new Date('2023-10-27T12:00:00'); // Friday
const formatted = format(date, 'EEE', { locale: ptBR });
console.log(`Formatted: "${formatted}"`);
console.log(`Uppercased: "${formatted.toUpperCase()}"`);
console.log(`Replaced: "${formatted.toUpperCase().replace('.', '')}"`);
