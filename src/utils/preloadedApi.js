// Kept as a compatibility boundary for components that previously read a
// build-time browser payload. SSR now renders from route data and the browser
// always reads current API responses after hydration.
export const getPreloadedApiMap = () => null;

export const readPreloadedApiResponse = () => null;

export const hasPreloadedApiResponse = () => false;

export default readPreloadedApiResponse;
