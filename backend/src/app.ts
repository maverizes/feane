import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServeStaticModule } from '@nestjs/serve-static';
import { appConfig, dbConfig, jwtConfig } from '@config';
import {
  AuthModule,
  Category,
  CategoryModule,
  Food,
  FoodModule,
  Order,
  OrderItem,
  OrderModule,
  Review,
  ReviewModule,
  UploadModule,
  User,
  UserModule,
} from '@modules';
import { CheckAuthGuard, CheckRoleGuard } from '@guards';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MailModule } from './modules/mailer/mailer.module';

@Module({
  imports: [
    // Throttler for rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 30000,
        limit: 300,
      },
    ]),
    
    // Config module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig], // Load additional configurations
    }),

    // Serve static files
    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      rootPath: './uploads',
    }),

    // JWT module for authentication
    JwtModule.register({
      secret: 'my secret', // Consider moving this to the config
      global: true,
      signOptions: {
        expiresIn: 60 * 15, // Token expiration time
      },
    }),

    // Sequelize module for database connection
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        try {
          return {
            dialect: 'postgres', // Use PostgreSQL as the database
            host: config.get('database.host'),
            port: config.get<number>('database.port'),
            username: config.get('database.user'),
            password: config.get('database.password'),
            database: config.get('database.dbName'),
            models: [Category, Food, User, Order, OrderItem, Review], // Register your models
            synchronize: true, // Use sync for development
            logging: console.log, // Enable logging
            autoLoadModels: true, // Automatically load models
          };
        } catch (error) {
          console.log(error); // Handle errors
        }
      },
    }),

    // Importing all necessary feature modules
    CategoryModule,
    FoodModule,
    UploadModule,
    UserModule,
    OrderModule,
    ReviewModule,
    AuthModule,
    MailModule, // Include the MailModule for email functionalities
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting guard
    },
    {
      useClass: CheckAuthGuard,
      provide: APP_GUARD, // Check authentication guard
    },
    {
      useClass: CheckRoleGuard,
      provide: APP_GUARD, // Check role guard
    },
  ],
})
export class AppModule {}
