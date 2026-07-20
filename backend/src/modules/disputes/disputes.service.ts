import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDisputeDto } from './dtos/create-dispute.dto';
import { AddDisputeMessageDto } from './dtos/add-dispute-message.dto';
import { UpdateDisputeDto } from './dtos/update-dispute.dto';
import { Role } from '@prisma/client';

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

    const existingDispute = await this.prisma.dispute.findUnique({
      where: { orderId: dto.orderId }
    });

    if (existingDispute) {
      throw new BadRequestException('A dispute already exists for this order');
    }

    return this.prisma.dispute.create({
      data: {
        orderId: dto.orderId,
        customerId: userId,
        reason: dto.reason,
        description: dto.description
      }
    });
  }

  async findAll(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.dispute.findMany({
        include: {
          customer: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, totalAmount: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return this.prisma.dispute.findMany({
      where: { customerId: userId },
      include: {
        order: { select: { id: true, totalAmount: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const dispute = await this.prisma.dispute.findUnique({
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

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (role !== Role.ADMIN && dispute.customerId !== userId) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  async addMessage(id: string, userId: string, role: Role, dto: AddDisputeMessageDto) {
    const dispute = await this.findOne(id, userId, role);

    return this.prisma.disputeMessage.create({
      data: {
        disputeId: dispute.id,
        senderId: userId,
        message: dto.message
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });
  }

  async updateStatus(id: string, dto: UpdateDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: (dto.status === 'RESOLVED_REFUND' || dto.status === 'RESOLVED_REJECT') ? new Date() : null
      }
    });
  }
}
