const sequelize = require('./config/database');
const { DataTypes } = require('sequelize');

async function updateDb() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        const queryInterface = sequelize.getQueryInterface();
        
        console.log('Creating report_categories table...');
        await queryInterface.createTable('report_categories', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING(255), allowNull: false },
            description: { type: DataTypes.TEXT },
            color: { type: DataTypes.STRING(50) },
            createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
        });
        console.log('Created report_categories table.');
        
        console.log('Adding category_id to reports...');
        try {
            await queryInterface.addColumn('reports', 'category_id', {
                type: DataTypes.INTEGER,
                references: {
                    model: 'report_categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
            console.log('category_id added to reports.');
        } catch (err) {
            console.log('Column might already exist or error occurred:', err.message);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database or run migrations:', error);
        process.exit(1);
    }
}

updateDb();
