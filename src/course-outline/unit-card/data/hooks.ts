import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { camelCaseObject } from '@edx/frontend-platform';
import { createCourseXblock } from '@src/course-unit/data/api';
import { getUnitHandler } from './api';

// Hook to fetch unit data (components + templates) when expanded
export const useUnitHandler = (unitId: string, enabled: boolean = false) => useQuery({
  queryKey: ['unitHandler', unitId],
  queryFn: () => getUnitHandler(unitId),
  enabled: enabled && !!unitId,
});

// Hook to create a new xblock component inside a unit, reusing the course-unit API
export const useCreateXBlockInUnit = (unitId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    // Wrap createCourseXblock to normalize the response with camelCase keys
    mutationFn: async (params: {
      parentLocator: string;
      type: string;
      category?: string;
      boilerplate?: string;
    }) => {
      const data = await createCourseXblock({
        type: params.type,
        category: params.category,
        parentLocator: params.parentLocator,
        boilerplate: params.boilerplate,
      });
      // Normalize snake_case response (locator, course_key) to camelCase
      return camelCaseObject(data) as { locator: string; courseKey: string };
    },
    onSuccess: () => {
      // Refetch the unit handler data so the new component appears
      queryClient.invalidateQueries({ queryKey: ['unitHandler', unitId] });
    },
  });
};
