/**
 * Helper to extract organizationId from request headers or query params
 * @param {Request} request - Next.js request object
 * @returns {string|null} organizationId
 */
export function getOrganizationId(request) {
  // Try to get from header first (for API calls)
  const headerOrgId = request.headers.get('x-organization-id');
  if (headerOrgId) return headerOrgId;

  // Try to get from URL searchParams (for GET requests)
  const { searchParams } = new URL(request.url);
  const queryOrgId = searchParams.get('organizationId');
  if (queryOrgId) return queryOrgId;

  return null;
}

/**
 * Validates if organizationId is provided, returns error response if not
 * @param {string|null} organizationId
 * @returns {Response|null} Error response or null if valid
 */
export function validateOrganizationId(organizationId) {
  if (!organizationId) {
    return Response.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }
  return null;
}

