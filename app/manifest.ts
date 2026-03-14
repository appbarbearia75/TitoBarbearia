import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agendaê | Agendamento Online',
    short_name: 'Agendaê',
    description: 'Agendamento rápido e fácil de barbearia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/simbol-logo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/ICON-PNG.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
