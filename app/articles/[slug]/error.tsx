"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main style={{padding:40,fontFamily:"Ubuntu, Arial, sans-serif"}}><h1>Document could not be loaded</h1><p>Please try again.</p><button onClick={reset}>Try again</button></main>;
}
