import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '2136881',
  key: process.env.PUSHER_KEY || 'c83b4566e58d78c1dd50',
  secret: process.env.PUSHER_SECRET || 'ed4de7ef1448ce39c28e',
  cluster: process.env.PUSHER_CLUSTER || 'ap1',
  encrypted: process.env.PUSHER_ENCRYPTED === 'true'
});

export default pusher;

export function triggerEvent(channel, event, data) {
  try {
    pusher.trigger(channel, event, data);
    console.log(`[Pusher] Triggered ${event} on ${channel}:`, data);
  } catch (error) {
    console.error('[Pusher] Trigger error:', error);
  }
}