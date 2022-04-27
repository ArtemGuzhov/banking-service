import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateUserDto } from '../dtos/create-user.dto'
import { UserEntity } from '../models/user.entity'

@Injectable()
export class UserService {
    logger: Logger

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) {
        this.logger = new Logger(UserService.name)
    }

    // QUERY

    async findAll(): Promise<UserEntity[]> {
        try {
            return await this.userRepository.find({
                relations: ['wallets', 'wallets.transactions'],
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
            await this.findOne(id)

            await this.userRepository.softRemove({ id })

            return 'User has been deleted'
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }
}
