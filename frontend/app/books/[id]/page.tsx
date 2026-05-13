import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/books/BookCover";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/Badge";
import { libraryService } from "@/lib/services/library";

function getGradientSeed(id: string | number) {
  if (typeof id === "number") return id;
  return String(id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getGradientForBook(id: string | number) {
  const gradients = [
    "linear-gradient(135deg, #1B2638, #3B4860)",
    "linear-gradient(135deg, #7C3F22, #B26845)",
    "linear-gradient(135deg, #1F4A3A, #3D7A60)",
    "linear-gradient(135deg, #BA9747, #D4B679)",
    "linear-gradient(135deg, #2D4C3B, #5A7B68)",
    "linear-gradient(135deg, #5C3A21, #8B5A33)",
    "linear-gradient(135deg, #4B2A3B, #7A4A5C)",
  ];
  return gradients[getGradientSeed(id) % gradients.length];
}

function actionLinkClasses(primary?: boolean) {
  return [
    "inline-flex items-center justify-center rounded-bc-md border px-5 py-3 text-sm font-semibold transition-all duration-300 ease-bc-ease",
    primary
      ? "border-white/10 bg-bc-primary-grad text-white shadow-bc-primary hover:-translate-y-0.5 hover:shadow-bc-primary-hover"
      : "border-bc-border-strong bg-bc-surface text-bc-text shadow-bc-sm hover:-translate-y-0.5 hover:border-bc-primary hover:text-bc-primary hover:shadow-bc-md",
  ].join(" ");
}

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = id;

  try {
    const book = await libraryService.getBook(bookId);
    const coverUrl = book.cover || book.cover_url;
    const pdfUrl = book.pdf || book.pdf_url;
    const genres = Array.isArray(book.genres) ? book.genres.filter(Boolean) : [];

    return (
      <PageLayout
        active="library"
        pageTitle={book.title}
        pageSubtitle={`by ${book.author}`}
        headerActions={
          <>
            <Link href="/library" className={actionLinkClasses(false)}>
              Back to library
            </Link>
            <Link
              href={pdfUrl ? `/library/read/${bookId}` : "#"}
              className={actionLinkClasses(true)}
              aria-disabled={!pdfUrl}
            >
              {pdfUrl ? "Read PDF" : "PDF unavailable"}
            </Link>
          </>
        }
      >
        <section className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="bc-card p-6">
            <BookCover
              title={book.title}
              author={book.author}
              gradient={coverUrl ? undefined : getGradientForBook(book.id)}
              coverUrl={coverUrl}
              width="100%"
              height={420}
            />
          </div>

          <div className="bc-card p-6 sm:p-7">
            <div className="flex flex-wrap gap-2">
              {book.is_featured && <Badge variant="primary">Featured</Badge>}
              {book.is_free && <Badge variant="success">Free</Badge>}
              {book.language && <Badge>{book.language}</Badge>}
              {!!book.pages && <Badge>{book.pages} pages</Badge>}
              {book.year_published && <Badge>{book.year_published}</Badge>}
            </div>

            <div className="mt-6">
              <h2 className="font-display text-[24px] font-semibold text-bc-text">
                About this book
              </h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-bc-text-soft">
                {book.description?.trim() || "No description has been added for this book yet."}
              </p>
            </div>

            {genres.length > 0 && (
              <div className="mt-6">
                <div className="text-[12px] uppercase tracking-[0.08em] text-bc-subtext">
                  Genres
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge key={genre} variant="soft">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-bc-md border border-bc-border bg-bc-surface-muted p-4">
                <div className="text-[11px] uppercase tracking-[0.08em] text-bc-subtext">
                  Author
                </div>
                <div className="mt-2 text-sm font-semibold text-bc-text">{book.author}</div>
              </div>
              <div className="rounded-bc-md border border-bc-border bg-bc-surface-muted p-4">
                <div className="text-[11px] uppercase tracking-[0.08em] text-bc-subtext">
                  PDF
                </div>
                <div className="mt-2 text-sm font-semibold text-bc-text">
                  {pdfUrl ? "Available" : "Not uploaded"}
                </div>
              </div>
              <div className="rounded-bc-md border border-bc-border bg-bc-surface-muted p-4">
                <div className="text-[11px] uppercase tracking-[0.08em] text-bc-subtext">
                  Added
                </div>
                <div className="mt-2 text-sm font-semibold text-bc-text">
                  {new Date(book.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="rounded-bc-md border border-bc-border bg-bc-surface-muted p-4">
                <div className="text-[11px] uppercase tracking-[0.08em] text-bc-subtext">
                  Reading Route
                </div>
                <div className="mt-2 text-sm font-semibold text-bc-text">
                  /library/read/{bookId}
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  } catch {
    notFound();
  }
}
