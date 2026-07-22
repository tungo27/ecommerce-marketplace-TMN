import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { FlashSalesService } from './flash-sales.service';
import { CreateFlashSaleDto } from './dtos/create-flash-sale.dto';
import { UpdateFlashSaleStatusDto } from './dtos/update-flash-sale-status.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';

@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  @Get('active')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('active_flash_sales')
  @CacheTTL(30000) // 30 seconds — flash sales change often
  async getActiveFlashSales() {
    return this.flashSalesService.getActiveFlashSales();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Post()
  async createFlashSale(@Request() req: any, @Body() dto: CreateFlashSaleDto) {
    return this.flashSalesService.createFlashSale(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Get('seller')
  async getSellerFlashSales(@Request() req: any) {
    return this.flashSalesService.getSellerFlashSales(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  async getAdminPendingFlashSales() {
    return this.flashSalesService.getAdminPendingFlashSales();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id')
  async updateFlashSaleStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFlashSaleStatusDto,
  ) {
    return this.flashSalesService.updateFlashSaleStatus(req.user.id, id, dto);
  }
}
