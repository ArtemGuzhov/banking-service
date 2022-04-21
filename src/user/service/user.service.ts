import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { WalletEntity } from 'src/wallet/models/wallet.entity'
import { Connection, IsNull, Not, Repository } from 'typeorm'
import { ICreate } from '../interfaces/user-service.interface'
import { UserEntity } from '../models/user.entity'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private connection: Connection,
    ) {}

    // QUERY

    async findAll(filter?: string): Promise<UserEntity[]> {
        try {
            const usersWithFilter = async (type?: string) => {
                if (type === 'remote') {
                    return await this.userRepository.find({
                        withDeleted: true,
                        relations: ['wallets', 'wallets.transactions'],
                        where: {
                            deleted_at: Not(IsNull()),
                        },
                    })
                } else {
                    return await this.userRepository.find({
                        withDeleted: type === 'active' ? false : true,
                        relations: ['wallets', 'wallets.transactions'],
                    })
                }
            }

            if (filter === 'active') {
                return usersWithFilter('active')
            } else if (filter === 'remote') {
                return usersWithFilter('remote')
            } else if (!filter) {
                return usersWithFilter()
            } else {
                throw new HttpException(
                    `Your filter is not found`,
                    HttpStatus.NOT_FOUND,
                )
            }
        } catch (error) {
            console.log(`Server error(UserService: findAll): ${error}`)

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
            console.log(`Server error(UserService: findOne): ${error}`)

            throw error
        }
    }

    // Mutation

    async create(createUser: ICreate): Promise<UserEntity> {
        try {
            const { email, name } = createUser

            const lowerCaseName = name.toLocaleLowerCase()

            /* 
                Проверил по своим двум почтовым ящикам, почтовый адрес не чувствителен к регистру, что доменное имя, что имя почты.
            */
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
            console.log(`Server error(UserService: create): ${error}`)

            throw error
        }
    }

    async delete(id: number): Promise<String> {
        try {
            const queryRunner = this.connection.createQueryRunner()

            await queryRunner.connect()

            const user = await this.userRepository.findOne({
                where: {
                    id,
                },
                relations: ['wallets'],
            })

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND)
            }

            const walletsId = user.wallets
                .filter((wallet) => wallet.status === true)
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

                console.log(`Deleted user error: ${error}`)

                throw error
            } finally {
                await queryRunner.release()
            }

            return 'User has been deleted'
        } catch (error) {
            console.log(`Server error(UserService: delete): ${error}`)

            throw error
        }
    }
}
