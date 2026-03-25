import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

const getStudioBaseUrl = () => getConfig().STUDIO_BASE_URL;

// Shape of a single component inside a unit
export interface UnitComponent {
  blockId: string;
  blockType: string;
  displayName: string;
}

// Shape of one entry in the component_templates array returned by the API
export interface ComponentTemplate {
  type: string;
  displayName: string;
  beta?: boolean;
  templates: Array<{
    boilerplateName?: string;
    category?: string;
    displayName: string;
    supportLevel?: string | boolean;
  }>;
  supportLegend: {
    allowUnsupportedXblocks?: boolean;
    documentationLabel?: string;
    showLegend?: boolean;
  };
}

// Full response from the unit_handler endpoint
export interface UnitHandlerData {
  unitId: string;
  displayName: string;
  components: UnitComponent[];
  componentTemplates: ComponentTemplate[];
}

export const getUnitHandlerApiUrl = (unitId: string) => `${getStudioBaseUrl()}/api/contentstore/v1/unit_handler/${unitId}`;

/**
 * Get unit handler data including components and available component templates.
 * @param {string} unitId
 * @returns {Promise<UnitHandlerData>}
 */
export async function getUnitHandler(unitId: string): Promise<UnitHandlerData> {
  const { data } = await getAuthenticatedHttpClient().get(getUnitHandlerApiUrl(unitId));
  return camelCaseObject(data) as UnitHandlerData;
}
