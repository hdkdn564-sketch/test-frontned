"use client";
import Image from "next/image";

const partners = [
  { src: "/zein.webp",   alt: "Zain"   },
  { src: "/stc.webp",    alt: "STC"    },
  { src: "/vergin.webp", alt: "Virgin" },
  { src: "/mobilay.webp",alt: "Mobily" },
  { src: "/sslam.webp",  alt: "Salam"  },
];

export default function PartnersSection() {
  return (
    <section 
      className="w-full py-6" 
      style={{ 
        background: "linear-gradient(to bottom, rgba(2,211,255,0.02), rgba(255,255,255,0))"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1.5rem",
          padding: "0 1rem",
        }}
      >
        {partners.map((partner, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
              transition: "opacity 0.3s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
          >
            <Image
              src={partner.src}
              alt={partner.alt}
              width={80}
              height={40}
              className="object-contain"
              style={{ maxHeight: 36, width: "auto" }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}