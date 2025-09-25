import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';
import { Room, RoomStatus } from '../rooms/entities/room.entity';
import { RoomMember } from '../rooms/entities/room-member.entity';
import { dbConfig, adminConfig, featuresConfig } from '../config';

// Create DataSource using config
const createDataSource = () => {
  return new DataSource({
    type: dbConfig.type as any,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [User, Room, RoomMember],
    synchronize: dbConfig.synchronize,
    logging: dbConfig.logging,
    charset: dbConfig.charset,
    timezone: dbConfig.timezone,
    ssl: dbConfig.ssl,
    extra: dbConfig.connectionLimit ? {
      connectionLimit: dbConfig.connectionLimit,
    } : undefined,
  } as any);
};

export async function seed() {
  console.log(`🚀 Starting database seeding with ${dbConfig.type} configuration...`);
  
  const dataSource = createDataSource();

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // 获取仓库
    const userRepository = dataSource.getRepository(User);
    const roomRepository = dataSource.getRepository(Room);

    // 检查是否已经有管理员用户
    const existingAdmin = await userRepository.findOne({
      where: { username: adminConfig.username }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists, skipping creation');
    } else {
      // 创建管理员用户
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash(adminConfig.password, 12);
      
      const adminUser = userRepository.create({
        username: adminConfig.username,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      });

      await userRepository.save(adminUser);
      console.log(`✅ Admin user created: ${adminConfig.username}`);
    }

    // 检查是否已经有示例房间
    const existingRooms = await roomRepository.count();
    
    if (existingRooms === 0) {
      console.log('🏠 Creating sample rooms...');
      
      // 创建示例房间
      const sampleRooms = [
        {
          name: 'Frontend Interview Room',
          description: 'A room for frontend development interviews',
          roomCode: 'FRONT1',
          status: RoomStatus.NORMAL,
        },
        {
          name: 'Backend Interview Room',
          description: 'A room for backend development interviews',
          roomCode: 'BACK01',
          status: RoomStatus.NORMAL,
        },
        {
          name: 'Full Stack Interview Room',
          description: 'A room for full stack development interviews',
          roomCode: 'FULL01',
          status: RoomStatus.NORMAL,
        }
      ];

      for (const roomData of sampleRooms) {
        const room = roomRepository.create(roomData);
        await roomRepository.save(room);
        console.log(`✅ Sample room created: ${roomData.name} (${roomData.roomCode})`);
      }
    } else {
      console.log('🏠 Sample rooms already exist, skipping creation');
    }

    console.log('✅ Database seeding completed successfully');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('📤 Database connection closed');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seed().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
}