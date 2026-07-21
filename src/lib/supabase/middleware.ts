import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

// Set below only after Supabase verifies the JWT server-side (supabase.auth.getUser()).
// Downstream code (getCurrentProfile in lib/permissions.ts) trusts this id without
// re-verifying, so any copy of these headers arriving from the client is stripped
// first — the proxy is the only writer.
export const VERIFIED_USER_ID_HEADER = "x-verified-user-id";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(VERIFIED_USER_ID_HEADER);

  const cookiesToApply: {
    name: string;
    value: string;
    options?: CookieOptions;
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToApply.push(...cookiesToSet);
        },
      },
    },
  );

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  let user = null;
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch (error) {
    // Fail closed: if Supabase is unreachable/misconfigured, treat the
    // request as unauthenticated instead of letting it through.
    console.error("Failed to resolve Supabase session:", error);
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    requestHeaders.set(VERIFIED_USER_ID_HEADER, user.id);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  cookiesToApply.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  return response;
}
