/**
 * Validate required environment variables at server startup
 * Exits the process if any required variables are missing
 */
export function validateEnvironment(): void {
  const requiredEnvVars = [
    'EVRIPAY_API_URL',
    'EVRIPAY_CLIENT_ID',
    'EVRIPAY_API_KEY',
    'EVRIPAY_WEBHOOK_SECRET',
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease add these variables to your .env file.');
    console.error('See .env.example for reference.\n');
    process.exit(1);
  }

  // Log successful configuration (with redacted secrets)
  console.log('✅ Environment variables validated:');
  console.log(`   - EVRIPAY_API_URL: ${process.env.EVRIPAY_API_URL}`);
  console.log(`   - EVRIPAY_CLIENT_ID: ${process.env.EVRIPAY_CLIENT_ID?.substring(0, 8)}...`);
  console.log(`   - EVRIPAY_API_KEY: ${process.env.EVRIPAY_API_KEY?.substring(0, 12)}...`);
  console.log(`   - EVRIPAY_WEBHOOK_SECRET: [REDACTED]`);
  console.log(`   - MONGODB_URI: [CONFIGURED]`);
  console.log(`   - JWT_SECRET: [REDACTED]`);
}
