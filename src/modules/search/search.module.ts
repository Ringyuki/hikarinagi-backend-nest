import { Module } from '@nestjs/common'
import { TokenizationService } from './services/helper/tokenization.service'

@Module({
  providers: [TokenizationService],
  exports: [TokenizationService],
})
export class SearchModule {}
