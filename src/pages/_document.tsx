import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/images/aoplogo.png" />
        <link rel="apple-touch-icon" href="/images/aoplogo.png" />
        <meta name="theme-color" content="#121212" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
