import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { WalletEntity } from 'src/wallet/models/wallet.entity'
import { Connection, Repository } from 'typeorm'
import { CreateUserDto } from '../dtos/create-user.dto'
import { UserEntity } from '../models/user.entity'

@Injectable()
export class UserService {
    logger: Logger

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private connection: Connection,
    ) {
        this.logger = new Logger(UserService.name)
    }

    // QUERY

    async findAll(): Promise<UserEntity[]> {
        try {
            return await this.userRepository.find({
                relations: ['wallets', 'wallets.transactions'],
                order: {
                    id: 'ASC',
                },
            })
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }

    async findOne(id: number): Promise<UserEntity> {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                relations: ['wallets', 'wallets.transactions'],
            })

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND)
            }

            return user
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }

    // Mutation

    async create(createDto: CreateUserDto): Promise<UserEntity> {
        try {
            const { email, name } = createDto

            const lowerCaseName = name.toLocaleLowerCase()

            const lowerCaseEmail = email.toLowerCase()

            const userExist = await this.userRepository.findOne({
                email: lowerCaseEmail,
            })

            if (userExist) {
                throw new HttpException(
                    'User already exists',
                    HttpStatus.CONFLICT,
                )
            }

            return await this.userRepository.save({
                name: lowerCaseName,
                email: lowerCaseEmail,
            })
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }

    async delete(id: number): Promise<String> {
        try {
            const queryRunner = this.connection.createQueryRunner()

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

                throw error
            } finally {
                await queryRunner.release()
            }

            return 'User has been deleted'
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }
}
