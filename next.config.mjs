/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'vuaayfuhqbrkvwutcidw.supabase.co',
            }
        ]
    }
};

export default nextConfig;
