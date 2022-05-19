module.exports = {
    apps: [
        {
            name: 'wallet_user',
            script: './dist/main.js',
            exec_mode: 'cluster',
            cwd: './services/wallet_user/',
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
            script: './dist/main.js',
            exec_mode: 'cluster',
            cwd: './services/transaction/',
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
