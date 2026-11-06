"use client";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="w-full">
      <div className="mx-1 sm:mx-8 lg:mx-16 my-4">
        <div className="relative w-full overflow-hidden rounded-3xl">
          <Image
            src="/hero2.png"
            alt="Hero"
            width={1920}
            height={960}
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) calc(100vw - 64px), calc(100vw - 128px)"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}