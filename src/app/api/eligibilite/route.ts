import { NextRequest, NextResponse } from "next/server";
import { computeEligibility, EligibilityInput } from "@/lib/eligibility";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<EligibilityInput>;

  const input: EligibilityInput = {
    accountType: body.accountType ?? null,
    followerCount: body.followerCount ?? null,
    viewsLast30Days: body.viewsLast30Days ?? null,
    ageOver18: Boolean(body.ageOver18),
    countryCode: body.countryCode ?? null,
    noRecentInfraction: Boolean(body.noRecentInfraction),
  };

  const result = computeEligibility(input);
  return NextResponse.json(result);
}
