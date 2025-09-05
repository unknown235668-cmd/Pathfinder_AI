
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import { z } from 'zod';

const SearchParamsSchema = z.object({
  state: z.string().optional(),
  ownership: z.enum(['government', 'private']).optional(),
  category: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());

  const validation = SearchParamsSchema.safeParse(params);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
  }

  const { state, ownership, category, query, limit, cursor } = validation.data;

  try {
    let collegesQuery = firestore.collection('collegesMaster').orderBy('name');

    if (state) {
      collegesQuery = collegesQuery.where('state', '==', state);
    }
    if (ownership) {
      collegesQuery = collegesQuery.where('ownership', '==', ownership);
    }
    if (category) {
      collegesQuery = collegesQuery.where('category', '==', category);
    }
    // Note: Firestore does not support case-insensitive search or partial text search natively on multiple fields.
    // A more advanced search solution like Algolia or Elasticsearch would be needed for that.
    // The query filter below is a basic implementation.
    if (query) {
       collegesQuery = collegesQuery.where('name', '>=', query).where('name', '<=', query + '\uf8ff');
    }

    if (cursor) {
      const lastDoc = await firestore.collection('collegesMaster').doc(cursor).get();
      if (lastDoc.exists) {
        collegesQuery = collegesQuery.startAfter(lastDoc);
      }
    }

    collegesQuery = collegesQuery.limit(limit);

    const snapshot = await collegesQuery.get();

    if (snapshot.empty) {
      return NextResponse.json({ colleges: [], nextCursor: null });
    }

    const colleges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const nextCursor = snapshot.docs[snapshot.docs.length - 1]?.id || null;

    return NextResponse.json({ colleges, nextCursor });

  } catch (error: any) {
    console.error('Error fetching from Firestore:', error);
    return NextResponse.json({ error: 'Failed to fetch data from the database.', details: error.message }, { status: 500 });
  }
}
