import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SystemMessage, SystemMessageSchema } from './schemas/system-message.schema'
import { SystemMessageService } from './services/system-message.service'
import { Global } from '@nestjs/common'

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: SystemMessage.name, schema: SystemMessageSchema }])],
  providers: [SystemMessageService],
  exports: [SystemMessageService],
})
export class MessageModule {}
