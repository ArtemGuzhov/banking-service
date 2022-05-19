import { HttpService } from '@nestjs/axios'
import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { catchError, lastValueFrom, map } from 'rxjs'
import { CreateTransactionDto } from 'src/wallet/dtos/create-transaction.dto'
import { TransactionDto } from '../dtos/outputs/transaction.dto'

interface FindData {
    [key: string]: number
}

const API_TRANSACTION_SERVICE = 'http://localhost:5000/graphql'

@Injectable()
export class TransactionService {
    private readonly _logger = new Logger(TransactionService.name)

    constructor(
        @Inject('rabbit-mq-module') private readonly _client: ClientProxy,
        private readonly _httpService: HttpService,
    ) {}

    checout() {
        return this._client.emit('checout', {})
    }

    // QUERY

    async findAll(id?: number): Promise<TransactionDto[]> {
        try {
            const data: FindData = {}

            if (id) {
                data['id'] = id
            }

            const response = this._httpService
                .get(
                    `${API_TRANSACTION_SERVICE}?query={transactions${
                        data.id ? `(id: ${data.id})` : ''
                    }{
                        id
                        operation
                        sum
                        from
                        to
                        created_at
                        wallet_id
                        
                    }}`,
                )
                .pipe(
                    map((res) => res.data.data.transactions),
                    catchError((e) => {
                        this._logger.log(e)

                        throw new HttpException(
                            e.response.data,
                            HttpStatus.NOT_FOUND,
                        )
                    }),
                )

            const transactions = await lastValueFrom(response)

            return transactions
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async findOne(id: number): Promise<TransactionDto> {
        try {
            const response = this._httpService
                .get(
                    `${API_TRANSACTION_SERVICE}?query={transaction(id: ${id}){
                    id
                    operation
                    sum
                    from
                    to
                    created_at
                    wallet_id
                   
                }}`,
                )
                .pipe(
                    map((res) => res.data.data.transaction),
                    catchError((e) => {
                        this._logger.log(e)

                        throw new HttpException(
                            e.response.data,
                            HttpStatus.NOT_FOUND,
                        )
                    }),
                )

            const transaction = await lastValueFrom(response)

            return transaction
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async create(createDto: CreateTransactionDto) {
        try {
            this._logger.debug('Send data in rabbitmq for create transaction')

            return this._client.emit('producer-create', { ...createDto })
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async createTwoTransaction(createDto: CreateTransactionDto[]) {
        try {
            this._logger.debug(
                'Send data in rabbitmq for create two transactions',
            )

            return this._client.emit('producer-two-create', [...createDto])
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async sendStatusTransaction(status: number) {
        this._logger.debug(
            'Send data in rabbitmq for change status wallet_user microservice',
        )

        return this._client.emit('response-for-transaction-microservice', {
            status,
        })
    }
}
