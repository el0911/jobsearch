import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const location = searchParams.get('location');
  const industry = searchParams.get('industry');
  const token = searchParams.get('token');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const apiKey = process.env.SEARCHAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'SearchAPI API key not configured' }, { status: 500 });
  }

  let url = `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&engine=google_jobs&no_cache=true&num=100`;

  if (token) {
    url += `&next_page_token=${encodeURIComponent(token)}`;
  } else {
    if (location) {
      url += `&location=${encodeURIComponent(location)}`;
    }
    if (industry) {
      url += `&industry=${encodeURIComponent(industry)}`;
    }


  }

  console.log(url)


  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Error from SearchAPI' }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from SearchAPI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
