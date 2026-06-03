import { bootstrapService } from '@fems/shared';
import { AppModule } from './app.module';

bootstrapService({
  appModule: AppModule,
  serviceName: 'Inspection & Maintenance Service',
  defaultPort: 3008,
});
