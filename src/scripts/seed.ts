import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../users/entities/user.entity';
import { Room, RoomStatus } from '../rooms/entities/room.entity';
import { RoomMember } from '../rooms/entities/room-member.entity';

// Load environment variables
dotenv.config();

// Create DataSource with environment configuration
const createDataSource = () => {
  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'sqlite') {
    return new DataSource({
      type: 'sqlite',
      database: process.env.DB_DATABASE || './data/interview_system.db',
      entities: [User, Room, RoomMember],
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
      logging: process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development',
    });
  } else {
    const mysqlConfig: any = {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: +process.env.DB_PORT || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [User, Room, RoomMember],
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
      logging: process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development',
      charset: process.env.DB_CHARSET || 'utf8mb4',
      timezone: process.env.DB_TIMEZONE || '+08:00',
    };

    // 添加SSL配置
    if (process.env.DB_SSL === 'true') {
      mysqlConfig.ssl = true;
    } else if (process.env.DB_SSL === 'false') {
      mysqlConfig.ssl = false;
    }

    // 添加连接池配置
    const connectionLimit = process.env.DB_CONNECTION_LIMIT;
    if (connectionLimit) {
      mysqlConfig.extra = {
        connectionLimit: +connectionLimit,
      };
    }

    return new DataSource(mysqlConfig);
  }
};

const AppDataSource = createDataSource();

export async function seed() {
  try {
    console.log(`🚀 Starting database seeding with ${process.env.DB_TYPE || 'sqlite'} configuration...`);

    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const userRepository = AppDataSource.getRepository(User);
    const roomRepository = AppDataSource.getRepository(Room);

    // Create admin user
    const adminExists = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = userRepository.create({
        username: 'admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      });
      await userRepository.save(admin);
      console.log('✅ Admin user created: admin / admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create test user
    const testUserExists = await userRepository.findOne({
      where: { username: 'testuser' }
    });

    if (!testUserExists) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      const testUser = userRepository.create({
        username: 'testuser',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      });
      await userRepository.save(testUser);
      console.log('✅ Test user created: testuser / test123');
    } else {
      console.log('ℹ️  Test user already exists');
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

