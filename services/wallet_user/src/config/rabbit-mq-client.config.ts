import { Transport } from '@nestjs/microservices'

export const rabbitMqClientConfig = [
    {
        name: 'rabbit-mq-module',
        transport: Transport.RMQ,
        options: {
            urls: ['amqp://user:user@localhost:5672'],
            queue: 'rabbit-mq-nest-js',
        },
    },
]
