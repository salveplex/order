import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'lat and lng parameters required' },
        { status: 400 }
      );
    }

    // Use Kartverket's nearest address API
    const response = await fetch(
      `https://ws.geonorge.no/adresser/v1/sok?ned=${lat},${lng}&treffPerSide=1`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Kartverket reverse lookup error:', response.status);
      return NextResponse.json({ address: null });
    }

    const data = await response.json();

    if (!data.adresser || data.adresser.length === 0) {
      console.log('No address found for coordinates');
      return NextResponse.json({ address: null });
    }

    const address = data.adresser[0];
    const fullAddress = `${address.adressebetegnelse}, ${address.postnummer} ${address.poststed}`;

    console.log(`Reverse lookup: ${lat},${lng} → ${fullAddress}`);
    return NextResponse.json({ address: fullAddress });
  } catch (error) {
    console.error('Reverse lookup error:', error);
    return NextResponse.json({ address: null });
  }
}
