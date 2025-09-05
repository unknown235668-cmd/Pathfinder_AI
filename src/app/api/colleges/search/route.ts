
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import institutionsData from '@/lib/institutions.json';

// Define a more flexible schema for the institutions from the JSON file
const CollegeSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  city: z.string(),
  state: z.string(),
  website: z.string(),
  ownership: z.enum(['government', 'private']).default('government'), // Default to government for IITs
  category: z.string().default('Engineering'), // Default to Engineering for IITs
  address: z.string().optional(),
  approval_body: z.string().optional(),
  aliases: z.array(z.string()).optional(),
});

const AllInstitutions = z.array(CollegeSchema);

const SearchParamsSchema = z.object({
  state: z.string().optional(),
  ownership: z.enum(['government', 'private']).optional(),
  category: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.coerce.number().int().optional(), // Use a numeric cursor for array index
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());

  const validation = SearchParamsSchema.safeParse(params);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
  }

  const { state, ownership, category, query, limit } = validation.data;
  const cursor = validation.data.cursor || 0; // Start from index 0 if no cursor

  try {
    const allColleges = AllInstitutions.parse(institutionsData.institutions);

    // Apply filters
    let filteredColleges = allColleges.filter(college => {
      const stateMatch = !state || college.state === state;
      const ownershipMatch = !ownership || college.ownership === ownership;
      const categoryMatch = !category || college.category === category;
      const queryMatch = !query ||
        college.name.toLowerCase().includes(query.toLowerCase()) ||
        college.city.toLowerCase().includes(query.toLowerCase()) ||
        (college.aliases && college.aliases.some(alias => alias.toLowerCase().includes(query.toLowerCase())));
      return stateMatch && ownershipMatch && categoryMatch && queryMatch;
    });

    // Apply pagination
    const paginatedColleges = filteredColleges.slice(cursor, cursor + limit);
    const nextCursor = (cursor + paginatedColleges.length < filteredColleges.length) ? cursor + paginatedColleges.length : null;

    return NextResponse.json({ colleges: paginatedColleges, nextCursor });

  } catch (error: any) {
    console.error('Error processing college data:', error);
    // If the error is a Zod validation error, show details
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Data validation failed.', details: error.flatten() }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to process data.', details: error.message }, { status: 500 });
  }
}
