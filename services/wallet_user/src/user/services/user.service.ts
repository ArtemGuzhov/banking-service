import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { WalletEntity } from 'src/wallet/models/wallet.entity'
import { Connection, Repository } from 'typeorm'
import { CreateUserDto } from '../dtos/create-user.dto'
import { UserEntity } from '../models/user.entity'

@Injectable()
export class UserService {
    private readonly _logger = new Logger(UserService.name)

    constructor(
        @InjectRepository(UserEntity)
        private readonly _userRepository: Repository<UserEntity>,
        private readonly _connection: Connection,
    ) {}

    // QUERY

    async findAll(): Promise<UserEntity[]> {
        try {
            return await this._userRepository.find({
                relations: ['wallets'],
                order: {
                    id: 'ASC',
                },
            })
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async findOne(id: number): Promise<UserEntity> {
        try {
            const user = await this._userRepository.findOne({
                where: { id },
                relations: ['wallets'],
            })

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND)
            }

            return user
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    // Mutation

    async create(createDto: CreateUserDto): Promise<UserEntity> {
        try {
            const { email, name } = createDto

            const lowerCaseName = name.toLocaleLowerCase()

            const lowerCaseEmail = email.toLowerCase()

            const userExist = await this._userRepository.findOne({
                email: lowerCaseEmail,
            })

            if (userExist) {
                throw new HttpException(
                    'User already exists',
                    HttpStatus.CONFLICT,
                )
            }

            return await this._userRepository.save({
                name: lowerCaseName,
                email: lowerCaseEmail,
            })
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async delete(id: number): Promise<String> {
        try {
            const queryRunner = this._connection.createQueryRunner()

            await queryRunner.connect()

            const user = await this.findOne(id)

            const walletsId = user.wallets
                .filter((wallet) => wallet.status)
                .map((wallet) => wallet.id)

            await queryRunner.startTransaction()

            try {
                walletsId.forEach(async (id) => {
                    await queryRunner.manager.update(WalletEntity, id, {
                        closed_at: new Date(),
                        status: false,
                    })
                })

                await queryRunner.manager.softRemove(UserEntity, { id })

                await queryRunner.commitTransaction()
            } catch (error) {
                await queryRunner.rollbackTransaction()

                throw new HttpException(
                    'Error while deleting a user',
                    HttpStatus.CONFLICT,
                )
            } finally {
                await queryRunner.release()
            }

            return 'User has been deleted'
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }
}
