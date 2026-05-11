import { RiskModule } from '@/components/modules/RiskModule'
import { ForensicModule } from '@/components/modules/ForensicModule'

export const moduleRegistry: Record<string, React.FC<Record<string, unknown>>> = {
    RiskModule: RiskModule,
    // ControlModule: ControlModule,
    // TestingModule: TestingModule,
    ForensicModule: ForensicModule,
    // ESGModule: ESGModule
}
