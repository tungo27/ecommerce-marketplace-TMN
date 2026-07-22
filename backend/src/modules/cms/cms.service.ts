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

  async updateStorefrontConfig(adminId: string, dto: UpdateStorefrontDto) {
    // Automatically create a 50% flash sale for the hero product if selected
    if (dto.heroProductId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.heroProductId },
      });

      if (product) {
        const existingFlashSale = await this.prisma.flashSale.findFirst({
          where: {
            productId: product.id,
            status: 'APPROVED',
            endTime: { gt: new Date() },
          },
        });

        if (!existingFlashSale) {
          const salePrice = Number(product.price) * 0.5;
          await this.prisma.flashSale.create({
            data: {
              productId: product.id,
              sellerId: product.sellerId,
              discountPercentage: 50,
              salePrice: salePrice,
              status: 'APPROVED',
              startTime: new Date(),
              endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              adminNote: 'Auto-generated for Hero Banner 50% deal',
            },
          });
        }
      }
    }

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
            heroProductId: dto.heroProductId || '',
            announcement: dto.announcement || '',
            featuredCategoryIds: dto.featuredCategoryIds || []
          }
        }
      });
      return newConfig.value;
    }

    const [updatedConfig] = await this.prisma.$transaction([
      this.prisma.storefrontConfig.update({
        where: { id: config.id },
        data: {
          value: {
            ...(config.value as any),
            ...dto,
          }
        }
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetType: 'STOREFRONT',
          action: 'UPDATE_STOREFRONT_CONFIG',
          details: { updates: dto as any },
        }
      })
    ]);

    return updatedConfig.value;
  }
}
