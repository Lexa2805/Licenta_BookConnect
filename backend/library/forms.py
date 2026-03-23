from django import forms
from .models import LibraryBook

INPUT = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 placeholder-gray-400 transition"
FILE_INPUT = "w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
CHECKBOX = "h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"


class LibraryBookForm(forms.ModelForm):
    """ModelForm for creating and editing library books."""

    genres = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            "class": INPUT,
            "placeholder": "Fiction, Classic, Drama",
        }),
        label="Genres",
        help_text="Separate genres with commas",
    )

    class Meta:
        model = LibraryBook
        fields = [
            "title", "author", "description",
            "cover_url", "cover_image",
            "pdf_url", "pdf_file",
            "epub_url", "genres", "language",
            "pages", "year_published", "is_free", "is_featured",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"class": INPUT, "placeholder": "Enter book title"}),
            "author": forms.TextInput(attrs={"class": INPUT, "placeholder": "Enter author name"}),
            "description": forms.Textarea(attrs={"class": INPUT, "placeholder": "Enter book description", "rows": 4}),
            "cover_url": forms.URLInput(attrs={"class": INPUT, "placeholder": "https://example.com/cover.jpg"}),
            "cover_image": forms.FileInput(attrs={"class": FILE_INPUT, "accept": "image/*"}),
            "pdf_url": forms.URLInput(attrs={"class": INPUT, "placeholder": "https://example.com/book.pdf"}),
            "pdf_file": forms.FileInput(attrs={"class": FILE_INPUT, "accept": ".pdf"}),
            "epub_url": forms.URLInput(attrs={"class": INPUT, "placeholder": "https://example.com/book.epub"}),
            "language": forms.TextInput(attrs={"class": INPUT, "placeholder": "English"}),
            "pages": forms.NumberInput(attrs={"class": INPUT, "placeholder": "0", "min": "0"}),
            "year_published": forms.NumberInput(attrs={"class": INPUT, "placeholder": "2024", "min": "1000", "max": "2100"}),
            "is_free": forms.CheckboxInput(attrs={"class": CHECKBOX}),
            "is_featured": forms.CheckboxInput(attrs={"class": CHECKBOX}),
        }
        labels = {
            "title": "Book Title",
            "author": "Author",
            "description": "Description",
            "cover_url": "Cover Image URL (optional)",
            "cover_image": "Upload Cover Image",
            "pdf_url": "PDF URL (optional)",
            "pdf_file": "Upload PDF File",
            "epub_url": "EPUB URL (optional)",
            "genres": "Genres",
            "language": "Language",
            "pages": "Number of Pages",
            "year_published": "Year Published",
            "is_free": "Free to Read",
            "is_featured": "Featured Book",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name in ["cover_url", "cover_image", "pdf_url", "pdf_file",
                           "epub_url", "description", "year_published"]:
            if field_name in self.fields:
                self.fields[field_name].required = False
        # Pre-fill genres as comma-separated string
        if self.instance and self.instance.pk:
            genres_list = self.instance.genres or []
            if isinstance(genres_list, list):
                self.initial["genres"] = ", ".join(genres_list)

    def clean_genres(self):
        value = self.cleaned_data.get("genres", "")
        if isinstance(value, list):
            return value
        if not value:
            return []
        return [g.strip() for g in value.split(",") if g.strip()]
