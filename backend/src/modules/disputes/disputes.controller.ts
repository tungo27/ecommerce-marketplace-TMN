import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dtos/create-dispute.dto';
import { AddDisputeMessageDto } from './dtos/add-dispute-message.dto';
import { UpdateDisputeDto } from './dtos/update-dispute.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.disputesService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.disputesService.findOne(id, req.user.id, req.user.role);
  }

  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Req() req: any, @Body() dto: AddDisputeMessageDto) {
    return this.disputesService.addMessage(id, req.user.id, req.user.role, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDisputeDto) {
    return this.disputesService.updateStatus(id, dto);
  }
}
