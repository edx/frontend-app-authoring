import { useQuery } from '@tanstack/react-query';
import { getUnitHandler } from './api';

export const useUnitHandler = (unitId: string, enabled: boolean = true) => useQuery({
  queryKey: ['unitHandler', unitId],
  queryFn: () => getUnitHandler(unitId),
  enabled: enabled && !!unitId,
});
