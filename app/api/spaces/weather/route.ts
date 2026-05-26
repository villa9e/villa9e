import { NextResponse } from 'next/server';

const WEATHER_ICONS: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
};

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ temp: 72, condition: 'Clear', icon: '☀️', city: 'Your City', humidity: 55, wind: 8 });
  }

  try {
    // Default to Atlanta, GA — can be made user-specific via profile later
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Atlanta,US&appid=${apiKey}&units=imperial`,
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();
    const main = data.weather?.[0]?.main ?? 'Clear';
    return NextResponse.json({
      temp: Math.round(data.main?.temp ?? 72),
      condition: data.weather?.[0]?.description ?? main,
      icon: WEATHER_ICONS[main] ?? '🌤️',
      city: data.name ?? 'Your City',
      humidity: data.main?.humidity ?? 50,
      wind: Math.round(data.wind?.speed ?? 0),
    });
  } catch {
    return NextResponse.json({ temp: 72, condition: 'Clear', icon: '☀️', city: 'Your City', humidity: 55, wind: 8 });
  }
}
