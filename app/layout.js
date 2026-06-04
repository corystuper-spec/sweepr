export const metadata = {
  title: 'Sweepr — Denver Home Cleaning',
  description: 'On-demand home cleaning for the Denver metro. Instant pricing, background-checked cleaners.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Hanken+Grotesk:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body {
            background: #080A0C;
            color: #F3F4F2;
            font-family: 'Hanken Grotesk', system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Bricolage Grotesque', system-ui, sans-serif;
            font-weight: 800;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
