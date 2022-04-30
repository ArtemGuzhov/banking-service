import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'rabbit-mq-module',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://user:user@localhost:5672'],
                    queue: 'rabbit-mq-nest-js',
                },
            },
        ]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class RabbitMQModule {}
