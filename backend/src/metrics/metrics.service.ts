import { Injectable } from '@nestjs/common'
import { Counter, Registry, collectDefaultMetrics } from 'prom-client'

@Injectable()
export class MetricsService {
  readonly registry: Registry
  readonly httpRequestsTotal: Counter

  constructor() {
    this.registry = new Registry()
    collectDefaultMetrics({ register: this.registry })

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    })
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  getContentType(): string {
    return this.registry.contentType
  }
}
