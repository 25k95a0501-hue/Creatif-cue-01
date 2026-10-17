import Image from "next/image";

interface ClientLogo {
  name: string;
  imagePath: string;
  websiteUrl?: string;
}

const CLIENT_LOGOS: ClientLogo[] = [
  { name: "Demo client 01", imagePath: "/client-logos/demo-client-01.svg" },
  { name: "Demo client 02", imagePath: "/client-logos/demo-client-02.svg" },
  { name: "Demo client 03", imagePath: "/client-logos/demo-client-03.svg" },
  { name: "Demo client 04", imagePath: "/client-logos/demo-client-04.svg" },
  { name: "Demo client 05", imagePath: "/client-logos/demo-client-05.svg" },
  { name: "Demo client 06", imagePath: "/client-logos/demo-client-06.svg" },
];

function LogoMark({ logo }: { logo: ClientLogo }) {
  const image = (
    <Image
      src={logo.imagePath}
      alt={`${logo.name} logo placeholder`}
      width={220}
      height={80}
      loading="eager"
      unoptimized
    />
  );

  if (logo.websiteUrl) {
    return (
      <a
        className="client-marquee__logo"
        href={logo.websiteUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${logo.name} website`}
      >
        {image}
      </a>
    );
  }

  return <span className="client-marquee__logo">{image}</span>;
}

export default function ClientLogoMarquee() {
  return (
    <section className="client-marquee" aria-label="Client logos">
      <div className="client-marquee__viewport">
        <div className="client-marquee__track">
          <div className="client-marquee__group" role="list" aria-label="Demo client logos">
            {CLIENT_LOGOS.map((logo) => (
              <div className="client-marquee__item" role="listitem" key={logo.name}>
                <LogoMark logo={logo} />
              </div>
            ))}
            {CLIENT_LOGOS.map((logo) => (
              <div
                className="client-marquee__item client-marquee__item--duplicate"
                aria-hidden="true"
                key={`${logo.name}-repeat`}
              >
                <LogoMark logo={logo} />
              </div>
            ))}
          </div>
          <div className="client-marquee__group" aria-hidden="true">
            {CLIENT_LOGOS.map((logo) => (
              <div className="client-marquee__item" key={logo.name}>
                <LogoMark logo={logo} />
              </div>
            ))}
            {CLIENT_LOGOS.map((logo) => (
              <div className="client-marquee__item" key={`${logo.name}-repeat`}>
                <LogoMark logo={logo} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="client-marquee__edge client-marquee__edge--left" aria-hidden="true" />
      <span className="client-marquee__edge client-marquee__edge--right" aria-hidden="true" />
    </section>
  );
}
