import { env } from './env';

let snap: any = null;
let coreApi: any = null;

const isMidtransConfigured: boolean = !!(
  env.midtrans.serverKey &&
  env.midtrans.serverKey !== 'your_server_key' &&
  env.midtrans.clientKey &&
  env.midtrans.clientKey !== 'your_client_key'
);

if (isMidtransConfigured) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const midtransClient = require('midtrans-client');

    snap = new midtransClient.Snap({
      isProduction: env.midtrans.isProduction,
      serverKey: env.midtrans.serverKey,
      clientKey: env.midtrans.clientKey,
    });

    coreApi = new midtransClient.CoreApi({
      isProduction: env.midtrans.isProduction,
      serverKey: env.midtrans.serverKey,
      clientKey: env.midtrans.clientKey,
    });

    console.log('Midtrans payment gateway initialized');
  } catch (error) {
    console.warn('Midtrans initialization failed:', error);
  }
} else {
  console.log('Midtrans not configured — payment features disabled. Set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in .env to enable.');
}

export { snap, coreApi, isMidtransConfigured };
