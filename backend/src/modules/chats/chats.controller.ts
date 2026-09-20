import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AddChatMessageDto, CreateOrderChatDto } from './dtos/chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

@Controller('chats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /** Create or retrieve existing chat for an order */
  @Roles(Role.CUSTOMER, Role.SELLER)
  @Post()
  createOrGet(@Req() req: any, @Body() dto: CreateOrderChatDto) {
    return this.chatsService.createOrGet(req.user.id, req.user.role, dto);
  }

  @Roles(Role.CUSTOMER, Role.SELLER)
  @Get()
  findAll(@Req() req: any) {
    return this.chatsService.findAll(req.user.id, req.user.role);
  }

  @Roles(Role.CUSTOMER, Role.SELLER)
  @Get('by-order/:orderId')
  findByOrder(@Param('orderId') orderId: string, @Req() req: any) {
    return this.chatsService.findOneByOrderId(orderId, req.user.id, req.user.role);
  }

  @Roles(Role.CUSTOMER, Role.SELLER)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.chatsService.findOne(id, req.user.id, req.user.role);
  }

  @Roles(Role.CUSTOMER, Role.SELLER)
  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Req() req: any, @Body() dto: AddChatMessageDto) {
    return this.chatsService.addMessage(id, req.user.id, req.user.role, dto);
  }
}
