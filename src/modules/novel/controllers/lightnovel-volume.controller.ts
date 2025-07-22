import { Controller, Get, Param } from '@nestjs/common'
import { LightNovelVolumeService } from '../services/lightnovel-volume.service'

@Controller('lightnovel/volume')
export class LightNovelVolumeController {
  constructor(private readonly lightNovelVolumeService: LightNovelVolumeService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    const volume = await this.lightNovelVolumeService.findById(id)
    return {
      data: volume,
    }
  }
}
