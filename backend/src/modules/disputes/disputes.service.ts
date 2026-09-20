import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDisputeDto } from './dtos/create-dispute.dto';
import { AddDisputeMessageDto } from './dtos/add-dispute-message.dto';
import { UpdateDisputeDto, UpdateDisputeStatus } from './dtos/update-dispute.dto';
import { Role, ChatStatus } from '@prisma/client';

/**
 * DisputesService now maps to the OrderChat/OrderChatMessage schema.
 * The old Dispute/DisputeMessage tables were replaced in migration
 * 20260811041100_add_order_chat_product_reports.
 */
@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDisputeDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId }
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to you');
    }

    const existingChat = await this.prisma.orderChat.findUnique({
      where: { orderId: dto.orderId }
    });

    if (existingChat) {
      throw new BadRequestException('A support chat already exists for this order');
    }

    return this.prisma.orderChat.create({
      data: {
        orderId: dto.orderId,
        customerId: userId,
        status: ChatStatus.OPEN,
      }
    });
  }

  async findAll(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.orderChat.findMany({
        include: {
          customer: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, totalAmount: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return this.prisma.orderChat.findMany({
      where: { customerId: userId },
      include: {
        order: { select: { id: true, totalAmount: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const chat = await this.prisma.orderChat.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, totalAmount: true, status: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });

    if (!chat) {
      throw new NotFoundException('Dispute/chat not found');
    }

    if (role !== Role.ADMIN && chat.customerId !== userId) {
      throw new NotFoundException('Dispute/chat not found');
    }

    return chat;
  }

  async addMessage(id: string, userId: string, role: Role, dto: AddDisputeMessageDto) {
    const chat = await this.findOne(id, userId, role);

    return this.prisma.orderChatMessage.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        message: dto.message
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });
  }

  async updateStatus(adminId: string, id: string, dto: UpdateDisputeDto) {
    const chat = await this.prisma.orderChat.findUnique({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Dispute/chat not found');
    }

    // Map legacy dispute statuses to ChatStatus
    const newChatStatus =
      dto.status === UpdateDisputeStatus.RESOLVED_REFUND ||
      dto.status === UpdateDisputeStatus.RESOLVED_REJECT
        ? ChatStatus.CLOSED
        : ChatStatus.OPEN;

    const [updatedChat] = await this.prisma.$transaction([
      this.prisma.orderChat.update({
        where: { id },
        data: { status: newChatStatus },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetType: 'DISPUTE',
          targetId: id,
          action: 'UPDATE_DISPUTE_STATUS',
          details: { newStatus: dto.status },
        }
      })
    ]);

    return updatedChat;
  }
}
