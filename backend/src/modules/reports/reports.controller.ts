import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateProductReportDto, ReviewProductReportDto } from './dtos/report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  createReport(@Req() req: any, @Body() dto: CreateProductReportDto) {
    return this.reportsService.createReport(req.user.id, dto);
  }

  @Roles(Role.CUSTOMER)
  @Get('my')
  getMyReports(@Req() req: any) {
    return this.reportsService.getMyReports(req.user.id);
  }

  @Roles(Role.ADMIN)
  @Get()
  getAllReports() {
    return this.reportsService.getAllReports();
  }

  @Roles(Role.ADMIN)
  @Patch(':id/review')
  reviewReport(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewProductReportDto) {
    return this.reportsService.reviewReport(req.user.id, id, dto);
  }
}
