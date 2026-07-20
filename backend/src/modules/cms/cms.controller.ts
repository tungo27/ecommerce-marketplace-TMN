import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { UpdateStorefrontDto } from './dtos/update-storefront.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('storefront')
  getStorefrontConfig() {
    return this.cmsService.getStorefrontConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('storefront')
  updateStorefrontConfig(@Body() dto: UpdateStorefrontDto) {
    return this.cmsService.updateStorefrontConfig(dto);
  }
}
