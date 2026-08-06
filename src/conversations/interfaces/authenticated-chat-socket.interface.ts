import { Socket } from 'socket.io';

export interface ChatSocketUser {
  id: string;
  phone?: string;
  role?: string;
}

export interface AuthenticatedChatSocketData {
  user?: ChatSocketUser;
}

export type AuthenticatedChatSocket = Socket<
  Record<string, any>,
  Record<string, any>,
  Record<string, any>,
  AuthenticatedChatSocketData
>;
