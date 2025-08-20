import { Module } from '@nestjs/common'
import { TokenizationService } from './services/helper/tokenization.service'
import { SearchService } from './services/search.service'
import { SearchController } from './controllers/search.controller'

@Module({
  providers: [TokenizationService, SearchService],
  exports: [TokenizationService, SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
