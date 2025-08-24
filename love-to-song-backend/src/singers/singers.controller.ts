import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SingersService } from './singers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('singers')
@UseGuards(JwtAuthGuard)
export class SingersController {
  constructor(private readonly singersService: SingersService) {}

  @Get()
  findAll() {
    return this.singersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.singersService.findOne(id);
  }

  @Get(':id/songs')
  findSingerSongs(@Param('id', ParseIntPipe) id: number) {
    return this.singersService.findSingerSongs(id);
  }
}