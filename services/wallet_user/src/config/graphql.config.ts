import { join } from 'path'

export const graphQlConfig = {
    autoSchemaFile: join(
        process.cwd(),
        'services/wallet_user/schemas/schema.gql',
    ),
    sortSchema: true,
    playground: true,
}
