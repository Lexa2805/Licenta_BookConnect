import { notFound } from "next/navigation";
import { BookReaderClient } from "@/components/library/BookReaderClient";
import { libraryService } from "@/lib/services/library";

export default async function BookReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = Number(id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    notFound();
  }

  try {
    const book = await libraryService.getBook(bookId);
    return <BookReaderClient bookId={bookId} initialBook={book} />;
  } catch {
    notFound();
  }
}
