import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UIComponent, UIComponentSchema } from './schemas/ui-component.schema'
import { UIComponentController } from './controllers/ui-component.controller'
import { UIComponentService } from './services/ui-component.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: UIComponent.name, schema: UIComponentSchema }])],
  controllers: [UIComponentController],
  providers: [UIComponentService],
})
export class SiteModule {}
