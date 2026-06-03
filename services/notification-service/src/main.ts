import dns from 'node:dns';
import { bootstrapService } from '@fems/shared';
import { AppModule } from './app.module';

// Prefer IPv4 for SMTP (avoids ENETUNREACH when IPv6 to Gmail is unreachable)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

bootstrapService({
  appModule: AppModule,
  serviceName: 'Notification Service',
  defaultPort: 3004,
});
