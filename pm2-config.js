module.exports = {
    apps: [
        {
            name: 'wallet_user',
            script: './services/wallet_user/dist/main.js',
            args: 'limit',
            exec_mode: 'fork',
            env: {
                HOST: 'localhost',
                PORT: 7000,
                PSQL_HOST: 'localhost',
                PSQL_PORT: 5432,
                PSQL_DATABASE: 'Wallet_User',
                PSQL_USERNAME: 'user',
                PSQL_PASSWORD: 'user',
            },
        },
        {
            name: 'transaction',
            script: './services/transaction/dist/main.js',
            args: 'limit',
            exec_mode: 'fork',
            env: {
                HOST: 'localhost',
                PORT: 5000,
                PSQL_HOST: 'localhost',
                PSQL_PORT: 5432,
                PSQL_DATABASE: 'Transaction',
                PSQL_USERNAME: 'user',
                PSQL_PASSWORD: 'user',
            },
        },
    ],
}
