import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Thêm decorator @Global để bạn có thể import dùng ở mọi nơi mà không cần khai báo lại ở từng module con
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Xuất ra ngoài để các Repository/Service khác Inject vào dùng
})
export class PrismaModule {}