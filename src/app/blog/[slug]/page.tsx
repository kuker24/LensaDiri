import Link from "next/link";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold">Blog: {slug.replaceAll("-", " ")}</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Artikel dan informasi seputar eksplorasi kepribadian, privasi, dan data.
      </p>
      <Link className="underline" href="/dashboard">
        Kembali
      </Link>
    </main>
  );
}
