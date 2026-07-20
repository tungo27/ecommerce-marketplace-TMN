import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateStorefrontDto } from './dtos/update-storefront.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStorefrontConfig() {
    let config = await this.prisma.storefrontConfig.findUnique({
      where: { key: 'storefront_main' }
    });
    
    if (!config) {
      config = await this.prisma.storefrontConfig.create({
        data: {
          key: 'storefront_main',
          value: {
            theme: 'light',
            heroImage: '',
            announcement: '',
            featuredCategoryIds: []
          }
        }
      });
    }
    return config.value;
  }

  async updateStorefrontConfig(dto: UpdateStorefrontDto) {
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { key: 'storefront_main' }
    });

    if (!config) {
      const newConfig = await this.prisma.storefrontConfig.create({
        data: {
          key: 'storefront_main',
          value: {
            theme: dto.theme || 'light',
            heroImage: dto.heroImage || '',
            announcement: dto.announcement || '',
            featuredCategoryIds: dto.featuredCategoryIds || []
          }
        }
      });
      return newConfig.value;
    }

    const updatedConfig = await this.prisma.storefrontConfig.update({
      where: { id: config.id },
      data: {
        value: {
          ...(config.value as any),
          ...dto,
        }
      }
    });

    return updatedConfig.value;
  }
}
