import * as dotenv from 'dotenv';
import { UnifiedCronService } from '../shared/services/unified-cron-service';

dotenv.config();

UnifiedCronService.startCronJob('smart-bot-simulator-buy');