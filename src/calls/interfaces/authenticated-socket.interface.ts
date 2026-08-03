import { Socket } from 'socket.io';

export interface SocketUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}
