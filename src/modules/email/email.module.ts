import { Module, Logger } from '@nestjs/common'
import { EmailService } from './services/email.service'
import { VerificationService } from './services/verification.service'
import { EmailController } from './controllers/email.controller'
import { HikariConfigModule } from '../../common/config/config.module'

@Module({
  imports: [HikariConfigModule],
  providers: [EmailService, VerificationService, Logger],
  controllers: [EmailController],
  exports: [EmailService, VerificationService],
})
export class EmailModule {}
