// file: love-to-song-backend/src/components/components.module.ts
import { Module } from '@nestjs/common';
import { ComponentsController } from './components.controller';

@Module({
  controllers: [ComponentsController],
})
export class ComponentsModule {}

