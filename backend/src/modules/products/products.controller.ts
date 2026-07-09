import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiQuery } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsService } from './products.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
}

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Category filter (Electronics, Fashion, Home_Living, Cosmetics, Food)' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by product name or description' })
  async findPublicProducts(@Query() query: Record<string, any>) {
    return this.productsService.findPublicProducts(query);
  }

  @Get('products/:id')
  async findPublicProductById(@Param('id') id: string) {
    return this.productsService.findPublicProductById(id);
  }

  @Get('seller/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async findSellerProducts(@Req() req: { user: { id: string } }, @Query('status') status?: string) {
    return this.productsService.findSellerProducts(req.user.id, status);
  }

  @Get('seller/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async findSellerProductById(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    const product = await this.productsService.findSellerProductById(req.user.id, id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Put('seller/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateSellerProduct(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    const dto = plainToInstance(UpdateProductDto, body, { enableImplicitConversion: true });
    const validationErrors = await validate(dto, { skipMissingProperties: true });

    if (validationErrors.length > 0) {
      const constraints = validationErrors.flatMap((error) => Object.values(error.constraints ?? {}));
      throw new BadRequestException(constraints);
    }

    return this.productsService.updateSellerProduct(req.user.id, id, dto);
  }

  @Patch('seller/products/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async patchSellerProductStatus(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    if (!['Draft', 'Hidden'].includes(status)) {
      throw new BadRequestException('Status must be Draft or Hidden');
    }
    return this.productsService.patchSellerProductStatus(req.user.id, id, status as 'Draft' | 'Hidden');
  }

  @Post('seller/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FilesInterceptor('images', 5))
  async createProduct(
    @Req() req: { user: { id: string } },
    @Body() body: CreateProductDto,
    @UploadedFiles() files: MulterFile[],
  ) {
    const dto = plainToInstance(CreateProductDto, body, { enableImplicitConversion: true });
    const validationErrors = await validate(dto);

    if (validationErrors.length > 0) {
      const constraints = validationErrors.flatMap((error) => Object.values(error.constraints ?? {}));
      throw new BadRequestException(constraints);
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Only JPG, PNG, and WEBP image files are allowed');
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException('Each image must be smaller than 5MB');
      }
    }

    return this.productsService.createProduct(req.user.id, dto, files);
  }

  @Get('admin/products/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPendingProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getPendingProducts(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Patch('admin/products/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async reviewProduct(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
  ) {
    if (action !== 'APPROVE' && action !== 'REJECT') {
      throw new BadRequestException('Action must be APPROVE or REJECT');
    }
    return this.productsService.reviewProduct(req.user.id, id, action);
  }
}
