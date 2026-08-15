export default {
  name: 'studyai',
  slug: 'studyai',
  version: '1.0.0',
  extra: {
    anthropicApiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  },
};