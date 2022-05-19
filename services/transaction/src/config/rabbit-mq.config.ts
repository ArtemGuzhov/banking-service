import { Transport } from '@nestjs/microservices'

export const rabbitMqConfig = {
    transport: Transport.RMQ,
    options: {
<<<<<<< Updated upstream
        urls: ['amqp://user:user@rabbitmq:5672'],
        queue: 'rabbit-mq-nest-js',
=======
        urls: ['amqp://user:user@localhost:5672'],
        queue: 'transaction',
>>>>>>> Stashed changes
        noAck: false,
        prefetchCount: 1,
    },
}
