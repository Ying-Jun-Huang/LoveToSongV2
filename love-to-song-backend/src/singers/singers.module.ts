import { Module } from '@nestjs/common';
import { SingersService } from './singers.service';
import { SingersController } from './singers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SingersController],
  providers: [SingersService],
  exports: [SingersService]
})
export class SingersModule {}