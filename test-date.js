
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const days = ['2023-10-22', '2023-10-23', '2023-10-24', '2023-10-25', '2023-10-26', '2023-10-27', '2023-10-28'];
// Sun to Sat

days.forEach(day => {
    const d = new Date(day);
    const short = format(d, 'EEE', { locale: ptBR });
    const shortUpper = short.toUpperCase().replace('.', '');
    console.log(`${day}: ${short} -> ${shortUpper}`);
});
