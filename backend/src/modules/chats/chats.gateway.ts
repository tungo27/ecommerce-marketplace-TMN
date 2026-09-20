import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chats',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_chat_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('chatId') chatId: string,
  ) {
    if (chatId) {
      client.join(chatId);
      this.logger.log(`Client ${client.id} joined chat room: ${chatId}`);
      return { event: 'joinedRoom', data: chatId };
    }
  }

  @SubscribeMessage('leave_chat_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('chatId') chatId: string,
  ) {
    if (chatId) {
      client.leave(chatId);
      this.logger.log(`Client ${client.id} left chat room: ${chatId}`);
      return { event: 'leftRoom', data: chatId };
    }
  }

  broadcastNewMessage(chatId: string, message: any) {
    this.server.to(chatId).emit('new_chat_message', message);
  }
}
