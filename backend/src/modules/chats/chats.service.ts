import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddChatMessageDto, CreateOrderChatDto } from './dtos/chat.dto';
import { Role } from '@prisma/client';
import { ChatsGateway } from './chats.gateway';

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatsGateway: ChatsGateway,
  ) {}

  /** Customer or Seller can initiate a chat for an order */
  async createOrGet(userId: string, role: Role, dto: CreateOrderChatDto) {
    // Verify user has access to this order
    let order: any;
    if (role === Role.CUSTOMER) {
      order = await this.prisma.order.findFirst({ where: { id: dto.orderId, userId } });
    } else if (role === Role.SELLER) {
      order = await this.prisma.order.findFirst({
        where: {
          id: dto.orderId,
          items: { some: { product: { sellerId: userId } } },
        },
      });
    }

    if (!order) {
      throw new NotFoundException('Order not found or access denied');
    }

    // Return existing chat or create new one
    const existing = await this.prisma.orderChat.findUnique({ where: { orderId: dto.orderId } });
    if (existing) return existing;

    return this.prisma.orderChat.create({
      data: {
        orderId: dto.orderId,
        customerId: role === Role.CUSTOMER ? userId : order.userId,
      },
    });
  }

  async findAll(userId: string, role: Role) {
    if (role === Role.SELLER) {
      return this.prisma.orderChat.findMany({
        where: {
          order: {
            items: { some: { product: { sellerId: userId } } },
          },
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, totalAmount: true, status: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    // CUSTOMER
    return this.prisma.orderChat.findMany({
      where: { customerId: userId },
      include: {
        order: { select: { id: true, totalAmount: true, status: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const chat = await this.prisma.orderChat.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        order: {
          select: {
            id: true, totalAmount: true, status: true,
            items: {
              include: { product: { select: { id: true, name: true, images: true } } },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    if (role === Role.SELLER) {
      const isSeller = await this.prisma.orderItem.findFirst({
        where: { orderId: chat.orderId, product: { sellerId: userId } },
      });
      if (!isSeller) throw new ForbiddenException('Access denied');
    } else if (role === Role.CUSTOMER && chat.customerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return chat;
  }

  async addMessage(id: string, userId: string, role: Role, dto: AddChatMessageDto) {
    const chat = await this.findOne(id, userId, role);

    if (chat.status === 'CLOSED') {
      throw new BadRequestException('This chat is closed');
    }

    const message = await this.prisma.orderChatMessage.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        message: dto.message,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Update chat updatedAt to bubble to top of list
    await this.prisma.orderChat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    this.chatsGateway.broadcastNewMessage(chat.id, message);

    return message;
  }

  async findOneByOrderId(orderId: string, userId: string, role: Role) {
    const chat = await this.prisma.orderChat.findUnique({ where: { orderId } });
    if (!chat) return null;
    return this.findOne(chat.id, userId, role);
  }
}
