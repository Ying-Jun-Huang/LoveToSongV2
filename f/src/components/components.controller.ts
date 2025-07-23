// file: love-to-song-backend/src/components/components.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('components')
export class ComponentsController {
  // Return a list of available component types (could be extended to include configs/templates)
  @Get()
  getAvailableComponents() {
    return [
      { type: 'SongList', displayName: 'Song List' },
      { type: 'Stats', displayName: 'Statistics' },
      // add more component definitions as needed
    ];
  }
}
