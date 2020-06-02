import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService} from './config/config.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/firstPhrase')
  async getFirstPhrase(): Promise<string> {
    return await this.configService.get('PORT');
  }

  @Get('secondPhrase')
  async getSecondPhrase(): Promise<string> {
    return await this.configService.get('MONGO_HOST');
  }
}
