import { Transport } from '@nestjs/microservices'
// rabbitmq
export const rabbitMqConfig = {
    transport: Transport.RMQ,
    options: {
        urls: ['amqp://user:user@localhost:5672'],
        queue: 'transaction',
        noAck: false,
        prefetchCount: 1,
    },
}
