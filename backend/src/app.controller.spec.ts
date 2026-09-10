import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      meeting: { count: jest.fn().mockResolvedValue(10), findMany: jest.fn().mockResolvedValue([]) },
      booking: { count: jest.fn().mockResolvedValue(5), findMany: jest.fn().mockResolvedValue([]) },
      editingProject: { count: jest.fn().mockResolvedValue(4), findMany: jest.fn().mockResolvedValue([]) },
      invoice: { count: jest.fn().mockResolvedValue(3), findMany: jest.fn().mockResolvedValue([]) },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      const health = await appController.getHealth();
      expect(health.status).toBe('ok');
      expect(health.timestamp).toEqual(expect.any(String));
      expect(health.uptime).toEqual(expect.any(Number));
    });
  });

  describe('dashboard stats', () => {
    it('should return dashboard stats', async () => {
      const stats = await appController.getDashboardStats();
      expect(stats.success).toBe(true);
      expect(stats.data).toBeDefined();
    });
  });
});

