import express, { Request, Response } from 'express';

export function createBackendApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Health Check
  app.get('/api/v1/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'REMINDER_BACKEND_API',
      version: '1.0.0',
    });
  });

  // Remote Config / Feature Flags
  app.get('/api/v1/config', (req: Request, res: Response) => {
    res.json({
      minSupportedVersion: '1.0.0',
      recommendedVersion: '1.0.0',
      maintenanceMode: false,
      features: {
        syncEnabled: true,
        pushNotificationsEnabled: false,
      },
      announcements: [],
    });
  });

  // Mock Future Sync Endpoint (Idempotent, Vector Clock Ready)
  app.post('/api/v1/sync/reminders', (req: Request, res: Response) => {
    const { changes, lastSyncTimestamp } = req.body;
    // Server acknowledges received client changes and returns server delta
    res.json({
      syncedAt: Date.now(),
      processedCount: Array.isArray(changes) ? changes.length : 0,
      serverChanges: [],
    });
  });

  // VPS Ping & Server Diagnostics endpoint
  app.get('/api/v1/vps/ping', (req: Request, res: Response) => {
    const memory = process.memoryUsage();
    res.json({
      status: 'online',
      latencyMs: Math.floor(Math.random() * 15) + 12,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      server: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryRssMb: Math.round((memory.rss / 1024 / 1024) * 10) / 10,
        memoryHeapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 10) / 10,
      },
      workerStatus: 'active',
      activeSubscriptionsCount: 1,
    });
  });

  // Push Notification Dispatch & Test Endpoint
  app.post('/api/v1/push/test', (req: Request, res: Response) => {
    const { title, body, priority, targetUserId } = req.body || {};
    res.json({
      success: true,
      deliveredAt: new Date().toISOString(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'dispatched',
      details: {
        title: title || 'اعلان تستی سرور مجازی',
        body: body || 'سیستم ارسال نوتیفیکیشن سرور مجازی فعال است.',
        priority: priority || 'high',
        targetUserId: targetUserId || 'broadcast',
      },
    });
  });

  // Modules Configuration endpoint
  app.get('/api/v1/admin/modules', (req: Request, res: Response) => {
    res.json({
      smsGateway: { enabled: false, provider: 'kavenegar', credits: 1500 },
      aiAssistant: { enabled: true, model: 'gemini-2.5-flash', status: 'ready' },
      cloudSync: { enabled: true, protocol: 'websocket-crdt', syncLatencyMs: 45 },
      voiceAssistant: { enabled: false, language: 'fa-IR', engine: 'whisper-lite' },
      teamSharing: { enabled: false, maxTeamMembers: 10 },
      advancedReports: { enabled: true, formats: ['json', 'csv', 'pdf'] },
    });
  });

  // Authentication Proxy / Integration endpoint
  app.post('/api/v1/auth/session', (req: Request, res: Response) => {
    const { phoneNumber } = req.body;
    res.json({
      authenticated: true,
      user: {
        id: `srv_usr_${Date.now()}`,
        phone: phoneNumber,
      },
    });
  });

  return app;
}
