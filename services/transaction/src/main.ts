import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { rabbitMqConfig } from './config/rabbit-mq.config'

const logger = new Logger('AppBootstrap')

const DEFAULT_APP_HORT = 'localhost'
const DEFAULT_APP_PORT = 3000

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.connectMicroservice(rabbitMqConfig)

    app.enableCors()
    app.useGlobalPipes(new ValidationPipe())

    const configService = app.get(ConfigService)

    const port = configService.get('PORT') || DEFAULT_APP_PORT
    const hostname = configService.get('HOST') || DEFAULT_APP_HORT

    app.startAllMicroservices()
    await app.listen(port, hostname, () =>
        logger.log(`Server running at ${hostname}:${port}`),
    )
}
bootstrap()
