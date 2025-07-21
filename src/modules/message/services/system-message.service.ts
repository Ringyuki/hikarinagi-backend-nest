import { Injectable } from '@nestjs/common'
import { SystemMessage, SystemMessageDocument } from '../schemas/system-message.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CounterService } from 'src/modules/shared/services/counter.service'
import { SendSystemMessageDto } from '../dto/send-system-message.dto'
import { CounterName } from 'src/modules/shared/types/couters.type'

@Injectable()
export class SystemMessageService {
  constructor(
    @InjectModel(SystemMessage.name) private systemMessageModel: Model<SystemMessageDocument>,
    private readonly counterService: CounterService,
  ) {}

  async sendSystemMessage(sendSystemMessageDto: SendSystemMessageDto) {
    const { targetUser, type, title, content, interactionType, interactUser, link, linkText } =
      sendSystemMessageDto

    const id = await this.counterService.getNextSequence(CounterName.SYSTEM_MESSAGE_ID)
    const systemMessage = new this.systemMessageModel({
      id,
      targetUser,
      type,
      title,
      content,
      interactionType,
      interactUser,
      link,
      linkText,
    })

    await systemMessage.save()
  }
}
