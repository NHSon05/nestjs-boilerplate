import { IsUUID } from 'class-validator';

export class TypingEventDto {
  @IsUUID()
  conversationId: string;
}
