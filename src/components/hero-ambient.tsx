export function HeroAmbient() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div
        className="hero-ambient-poster absolute inset-0 hidden bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url(/media/hero-poster.jpg)" }}
      />
      <video
        autoPlay
        className="hero-ambient-video absolute inset-0 h-full w-full object-cover opacity-90"
        disablePictureInPicture
        loop
        muted
        playsInline
        poster="/media/hero-poster.jpg"
        preload="metadata"
        tabIndex={-1}
      >
        <source src="/media/hero-ambient.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-black/25" />
    </div>
  );
}
