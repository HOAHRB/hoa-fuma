export const dynamic = 'force-static';

// Search is temporarily disabled. Keep this route static so direct requests
// do not invoke the Worker or execute the search index.
export function GET() {
  return new Response(null, { status: 404 });
}
