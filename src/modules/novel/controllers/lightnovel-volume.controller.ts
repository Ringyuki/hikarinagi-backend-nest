import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { LightNovelVolumeService } from '../services/lightnovel-volume.service'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../../modules/auth/enums/hikari-user-group.enum'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { UpdateVolumeHasEpubDto } from '../dto/update-volume-has-epub.dto'
import { CreateLightNovelVolumeDto } from '../dto/create-lightnovel-volume.dto'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'

@Controller('lightnovel/volume')
export class LightNovelVolumeController {
  constructor(private readonly lightNovelVolumeService: LightNovelVolumeService) {}

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Query('preview') preview: boolean = false,
  ) {
    const volume = await this.lightNovelVolumeService.findById(id, req, preview)
    return {
      data: volume,
    }
  }

  @Get('/download-signature/:novelId/:volumeId')
  @UseGuards(JwtAuthGuard)
  async generateDownloadSignature(
    @Param('volumeId') volumeId: number,
    @Param('novelId') novelId: number,
    @Req() req: RequestWithUser,
  ) {
    const { signature, timestamp } = await this.lightNovelVolumeService.generateDownloadSignature(
      volumeId,
      novelId,
      req.user._id.toString(),
    )
    return {
      data: {
        signature,
        timestamp,
      },
    }
  }

  @Get('/download/:novelId/:volumeId')
  @UseGuards(JwtAuthGuard)
  async generateDownloadUrl(
    @Param('novelId') novelId: number,
    @Param('volumeId') volumeId: number,
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: number,
    @Query('readOnline') readOnline: boolean,
    @Req() req: RequestWithUser,
  ) {
    const { url } = await this.lightNovelVolumeService.generateDownloadUrl(
      novelId,
      volumeId,
      signature,
      timestamp,
      req,
      readOnline,
    )
    return {
      data: {
        url,
      },
    }
  }

  @Post('create')
  @Roles(HikariUserGroup.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createLightNovelVolume(
    @Body() body: CreateLightNovelVolumeDto,
    @Req() req: RequestWithUser,
  ) {
    const volume = await this.lightNovelVolumeService.createLightNovelVolume(body, req)
    return {
      data: volume,
    }
  }

  @Put(':id/has-epub')
  @Roles(HikariUserGroup.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateHasEpub(@Param('id') id: number, @Body() body: UpdateVolumeHasEpubDto) {
    const volume = await this.lightNovelVolumeService.updateHasEpub(id, body)
    return {
      data: volume,
    }
  }
}
