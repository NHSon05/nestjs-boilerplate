import { io } from 'socket.io-client';
import { randomUUID } from 'node:crypto';

const accessToken = process.env.ACCESS_TOKEN;
const conversationId = process.env.CONVERSATION_ID;

if (!accessToken || !conversationId) {
  console.error('❌ Thiếu biến môi trường ACCESS_TOKEN hoặc CONVERSATION_ID');
  console.log(
    '👉 Cách chạy: ACCESS_TOKEN="your_token" CONVERSATION_ID="your_conv_id" node scripts/test-chat-socket.mjs',
  );
  process.exit(1);
}

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: accessToken,
  },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected successfully | Socket ID:', socket.id);

  console.log('➡️ Emitting conversation:join...');
  socket.emit('conversation:join', {
    conversationId,
  });
});

socket.on('socket:connected', (data) => {
  console.log('🔑 Authenticated info:', data);
});

socket.on('conversation:joined', (response) => {
  console.log('🚪 Successfully joined room:', response);

  console.log('✉️ Emitting message:send...');
  socket.emit('message:send', {
    conversationId,
    type: 'TEXT',
    content: 'Test realtime message từ Node.js Script 🚀',
    clientMessageId: randomUUID(),
  });
});

socket.on('message:sent', (ack) => {
  console.log('📩 Client receive ACK (message:sent):', ack);
});

socket.on('message:new', (eventData) => {
  console.log('💬 Received broadcast (message:new):', eventData);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});
