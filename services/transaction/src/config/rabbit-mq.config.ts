import { Transport } from '@nestjs/microservices'

export const rabbitMqConfig = {
    transport: Transport.RMQ,
    options: {
        urls: ['amqp://user:user@localhost:5672'],
        queue: 'rabbit-mq-nest-js',
        noAck: false,
        prefetchCount: 1,
    },
}
