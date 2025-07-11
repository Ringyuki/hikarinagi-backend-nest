import { Module } from '@nestjs/common'
import { GalgameService } from './services/galgame.service'
import { GalgameController } from './controllers/galgame.controller'
import { Galgame, GalgameSchema } from './schemas/galgame.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { GalgameLinks, GalgameLinksSchema } from './schemas/galgame-links.schema'
import { Article, ArticleSchema } from '../content/schemas/article.schema'
import { Post, PostSchema } from '../content/schemas/post.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Galgame.name, schema: GalgameSchema }]),
    MongooseModule.forFeature([{ name: GalgameLinks.name, schema: GalgameLinksSchema }]),
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  controllers: [GalgameController],
  providers: [GalgameService],
})
export class GalgameModule {}
