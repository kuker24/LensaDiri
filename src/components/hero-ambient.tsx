export function HeroAmbient() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_22%,rgba(175,80,255,0.2),transparent_25rem),radial-gradient(circle_at_72%_20%,rgba(225,189,255,0.07),transparent_22rem),linear-gradient(145deg,#090909_15%,#121016_58%,#090909)]" />
      <div
        className="hero-ambient-poster absolute inset-0 hidden bg-cover bg-center opacity-55"
        style={{ backgroundImage: "url(/media/hero-poster.jpg)" }}
      />
      <video
        autoPlay
        className="hero-ambient-video absolute inset-0 h-full w-full object-cover opacity-55"
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
      <div className="absolute inset-0 bg-[#090909]/35" />
    </div>
  );
}
