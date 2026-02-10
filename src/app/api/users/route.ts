import { NextResponse } from "next/server";
import { users } from "@/lib/seed-data";

export async function GET() {
  return NextResponse.json(users);
}
